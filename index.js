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
		"sessionId": sessionId
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
	message = new Buffer(message).toString("base64");
	return message;
}
let decodeMessage = function(message){
	message = new Buffer(message).toString("utf-8");
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

let reply = function(template){
	return {
		text : template.text,
		buttons : template.buttons || undefined
	}
}

let createButton = function(title, action, value){
	return {
		title : title,
		action : action,
		value : value
	}
}

let createTemplate = function(text, buttons){
	return {
		text : text,
		buttons : buttons || undefined
	}
}

let menuTemplate = {
	"text" : "Chào bạn! Bạn đang muốn làm gì?",
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


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/sendMessage",function(req, res){
	let input = req.body;
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
				}
				session[input.user]["currentFlow"] = "create.name";
				res.send(reponseMess);
			});
		}
		else if(session[input.user]["currentFlow"] === "create.name"){
			requestMessage = "address " + encodeMessage(input.message);
			sendMessageToGG(requestMessage, input.user, false, (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.name";
				}
				session[input.user]["currentFlow"] = "create.address";
				res.send(reponseMess);
			});
		}
		else if(session[input.user]["currentFlow"] === "create.address"){
			requestMessage = "city " + encodeMessage(input.message);
			sendMessageToGG(requestMessage, input.user, false, (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.address";
				}
				session[input.user]["currentFlow"] = "create.city";
				res.send(reponseMess);
			});
		}
		else if(session[input.user]["currentFlow"] === "create.city"){
			requestMessage = "investor " + encodeMessage(input.message);
			sendMessageToGG(requestMessage, input.user, false, (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.city";
				}
				session[input.user]["currentFlow"] = "create.investor";
				res.send(reponseMess);
			});
		}
		else if(session[input.user]["currentFlow"] === "create.investor"){
			requestMessage = "unit " + encodeMessage(input.message);
			sendMessageToGG(requestMessage, input.user, false, (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.investor";
				}
				session[input.user]["currentFlow"] = "create.unit";
				res.send(reponseMess);
			});
		}
		else if(session[input.user]["currentFlow"] === "create.unit"){
			requestMessage = "type " + encodeMessage(input.message);
			sendMessageToGG(requestMessage, input.user, false, (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.unit";
				}
				session[input.user]["currentFlow"] = "create.type";
				res.send(reponseMess);
			});
		}
		else if(session[input.user]["currentFlow"] === "create.type"){
			requestMessage = "designType " + encodeMessage(input.message);
			sendMessageToGG(requestMessage, input.user, false, (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.type";
				}
				session[input.user]["currentFlow"] = "create.designType";
				res.send(reponseMess);
			});
		}
		else if(session[input.user]["currentFlow"] === "create.designType"){
			requestMessage = "level " + encodeMessage(input.message);
			sendMessageToGG(requestMessage, input.user, false, (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.designType";
				}
				session[input.user]["currentFlow"] = "create.level";
				res.send(reponseMess);
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
				res.send({text : "Bạn chỉ có thể chọn 'Đồng ý' hoặc 'Không'"});
			}
			else{
				res.send({text : "Bạn chỉ có thể chọn 'Đồng ý' hoặc 'Không'"});
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
		let reponseMess = reply(menuTemplate);
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
