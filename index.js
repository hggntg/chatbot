const https = require('https');
const express = require('express');

let app = express();
let session = [];
let getValue = function(obj, path){
	if(typeof obj !== "object"){
		return null;
	}
	let keys = path.split(".");
	let keysLength = keys.length;
	let tempObj = Object.assign({},obj);
	for(let i = 0; i < keysLength; i++){
		tempObj = tempObj[keys[i]];
		if(!tempObj || (typeof tempObj !== "object" && i < keysLength - 2)){
			return null;
		}
	}
	return tempObj;
}


const port = 3000;
const CLIENT_TOKEN = "5e8503c7d5544a629f303ca20240b26b";
const DEV_TOKEN = "";
const bodyParser = require('body-parser');


const apiHost = "api.dialogflow.com";

let sendMessageToGG = function(query, sessionId, isFirst, callback){
	let request = {
		"lang": "en",
		"query": query,
		"sessionId": new Buffer(sessionId.substring(0,24)).toString("base64")
	}
	if(isFirst){
		request["resetContexts"] = true;
	}
	let postBody = JSON.stringify(request);
	let reqPost = https.request({
		host : apiHost,
		path : "/v1/query",
		method : "POST",
		headers :{
			"Content-Type" : "application/json, charset=utf-8",
			"Content-Length" : postBody.length,
			Authorization: "Bearer " + CLIENT_TOKEN
		}
	},function(res){
		var chunks = [];

		res.on("data", function (chunk) {
			chunks.push(chunk);
		});

		res.on("end", function () {
			var body = Buffer.concat(chunks);
			callback(JSON.parse(body.toString()));
		});
	});
	reqPost.write(postBody);
	reqPost.end();
}

let encodeMessage = function(message){
	message = new Buffer(message, "utf-8").toString("base64");
	message = message.replace(/\//g,"hspskb");
	return message;
}
let decodeMessage = function(message){
	message = message.replace(/hspskb/g,"\/");
	message = new Buffer(message, "base64").toString("utf-8");
	return message;
}
let getContext = function(input, contextName, callback){
	let reqGet = https.request({
		host : apiHost,
		path : `/v1/contexts/${contextName}?v=20150910&sessionId=${input.user}`,
		method : "GET",
		headers :{
			"Content-Type" : "application/json, charset=utf-8",
			Authorization: "Bearer " + CLIENT_TOKEN
		}
	},function(res){
		var chunks = [];

		res.on("data", function (chunk) {
			chunks.push(chunk);
		});

		res.on("end", function () {
			var body = Buffer.concat(chunks);
			callback(JSON.parse(body.toString()));
		});
	});
	reqGet.end();
}

let reply = function(params){
	let templates = arguments;
	let response = [];
	let templatesLength = templates.length;
	for(let i = 0; i < templatesLength; i++){
		response.push({text : templates[i].text, buttons : templates[i].buttons});
	}
	return response;
}

let createButton = function(title, action, value){
	return {
		title : title,
		action : action,
		value : value
	}
}

let createTemplate = function(text, buttons = null){
	return {
		text : text,
		buttons : buttons || undefined
	}
}

let menuTemplate = {
	"text" : "",
	"buttons" : [
	{
		"title" : "Bạn muốn tạo công trình mới?",
		"action" : "create",
		"value" : "create"
	},
	{
		"title" : "Bạn muốn chỉnh sửa thông tin công trình?",
		"action" : "update",
		"value" : "create"
	}
	]
}

let yesOrNoTemplate = {
	"text" : "",
	"buttons" : [
	{
		"title" : "Đồng ý",
		"action" : "select",
		"value" : "yes"
	},
	{
		"title" : "Hủy",
		"action" : "select",
		"value" : "no"
	}
	]
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.all("/*",function(req, res, next){
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, POST, DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type');

	next();
})

app.post("/sendMessage",function(req, res){
	let input = req.body;
	let template = createTemplate("");
	if(input.flow === "create"){
		if(!session[input.user]){
			session[input.user] = {};
			session[input.user]["currentFlow"] = null;
		}
		let requestMessage = "";
		if(session[input.user]["currentFlow"] === null){
			requestMessage = "name " + encodeMessage(input.message);
			sendMessageToGG(requestMessage, input.user, true, (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = null;
					res.send(reply(template));
				}
				else{
					session[input.user]["currentFlow"] = "create.name";
					template.text = reponseMess.result.speech;
					res.send(reply(template));
				}
			});
		}
		else if(session[input.user]["currentFlow"] === "create.name"){
			requestMessage = "address " + encodeMessage(input.message);
			sendMessageToGG(requestMessage, input.user, false, (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.name";
					res.send(reply(template));
				}
				else{
					session[input.user]["currentFlow"] = "create.address";
					template.text = reponseMess.result.speech;
					res.send(reply(template));
				}
			});
		}
		else if(session[input.user]["currentFlow"] === "create.address"){
			requestMessage = "city " + encodeMessage(input.message);
			sendMessageToGG(requestMessage, input.user, false, (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.address";
					res.send(reply(template));
				}
				else{
					session[input.user]["currentFlow"] = "create.city";
					template.text = reponseMess.result.speech;
					res.send(reply(template));
				}
			});
		}
		else if(session[input.user]["currentFlow"] === "create.city"){
			requestMessage = "investor " + encodeMessage(input.message);
			sendMessageToGG(requestMessage, input.user, false, (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.city";
					res.send(reply(template));
				}
				else{
					session[input.user]["currentFlow"] = "create.investor";
					template.text = reponseMess.result.speech;
					res.send(reply(template));
				}
			});
		}
		else if(session[input.user]["currentFlow"] === "create.investor"){
			requestMessage = "unit " + encodeMessage(input.message);
			sendMessageToGG(requestMessage, input.user, false, (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.investor";
					res.send(reply(template));
				}
				else{
					session[input.user]["currentFlow"] = "create.unit";
					template.text = reponseMess.result.speech;
					let types = ['Dân dụng', 'Công nghiệp', 'Giao thông', 'Thủy lợi', 'Hạ tầng kỹ thuật'];
					let typesLength = types.length;
					let buttons = [];
					for(let i = 0; i < typesLength; i++){
						buttons.push(createButton(types[i], "select", types[i]));
					}
					template.buttons = buttons;
					res.send(reply(template));
				}
			});
		}
		else if(session[input.user]["currentFlow"] === "create.unit"){
			requestMessage = "type " + encodeMessage(input.message);
			sendMessageToGG(requestMessage, input.user, false, (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.unit";
					res.send(reply(template));
				}
				else{
					session[input.user]["currentFlow"] = "create.type";
					template.text = reponseMess.result.speech;
					let designTypes = ['Thiết kế 1 bước', 'Thiết kế 2 bước', 'Thiết kế 3 bước'];
					let designTypesLength = designTypes.length;
					let buttons = [];
					for(let i = 0; i < designTypesLength; i++){
						buttons.push(createButton(designTypes[i], "select", designTypes[i]));
					}
					template.buttons = buttons;
					res.send(reply(template));
				}
			});
		}
		else if(session[input.user]["currentFlow"] === "create.type"){
			requestMessage = "designType " + encodeMessage(input.message);
			sendMessageToGG(requestMessage, input.user, false, (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.type";
				}
				session[input.user]["currentFlow"] = "create.designType";
				template.text = reponseMess.result.speech;
				let levels = ['Cấp I', 'Cấp II', 'Cấp III', 'Cấp IV', 'Cấp đặc biệt'];
				let levelsLength = levels.length;
				let buttons = [];
				for(let i = 0; i < levelsLength; i++){
					buttons.push(createButton(levels[i], "select", levels[i]));
				}
				template.buttons = buttons;
				res.send(reply(template));
			});
		}
		else if(session[input.user]["currentFlow"] === "create.designType"){
			requestMessage = "level " + encodeMessage(input.message);
			sendMessageToGG(requestMessage, input.user, false, (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.designType";
				}
				getContext(input, "createconstruction", function(context){
					session[input.user]["currentFlow"] = "create.level";
					template.text = reponseMess.result.speech;
					let choosingEle = [
					"constructionName","constructionAddress","constructionCity","constructionInvestor","constructionUnit",
					"constructionType","constructionDesignType","constructionLevel"
					];
					let choosingEleKey = [
					"Tên công trình","Địa chỉ","Thành phố","Nhà đầu tư","Đơn vị thi công","Loại công trình","Loại thiết kế","Cấp công trình"
					]
					let choosingEleLength = choosingEle.length;
					for(let i = 0; i < choosingEleLength; i++){
						template.text += "\\n" + choosingEleKey[i] + " : " + decodeMessage(context.parameters[choosingEle[i]]); 
					}
					let temp = Object.assign({}, yesOrNoTemplate);
					temp.text = "Bạn có muốn lưu công trình này?"
					res.send(reply(template, temp));
				});
			});
		}
		if(session[input.user]["currentFlow"] === "create.level"){
			if(input.message === "OK"){
				delete session[input.user];
				getContext(input, "createconstruction", function(context){
					res.send(context);
				});
			}
			else if(input.message === "NO"){
				delete session[input.user];
				let temp = Object.assign({}, menuTemplate);
				temp.text = "Bạn đang muốn làm gì?";
				let reponseMess = reply(temp);
				res.send(reponseMess);
			}
			else{
				res.send([{text : "Bạn chỉ có thể chọn 'Đồng ý' hoặc 'Không'"}]);
			}
		}
	}
	else if(input.flow === "update"){

	}
	else{
		res.send("OK");
	}
});

app.get("/reply", function(req, res){
	let input = req.query;
	if(input.type === "menu"){
		let temp = Object.assign({}, menuTemplate);
		temp.text = "Chào bạn! Bạn đang muốn làm gì?";
		let reponseMess = reply(temp);
		delete session[input.user];
		res.send(reponseMess);
	}
	else{
		res.status(404).send({error : "type not found"});
	}
});

app.get("/",function(req,res){
	res.redirect("http://redmine.vnclink.com");
});

app.listen(port,function(){
	console.log("Server is running on port " + port + ".");
});
