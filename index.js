const https = require('https');
const express = require('express');
const utf8 = require('utf8');

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

let sendMessageToGG = function(query, sessionId, contexts, callback){
	let request = {
		"contexts": contexts,
		"lang": "en",
		"query": query,
		"sessionId": sessionId
	}
	let postBody = JSON.stringify(request);
	console.log(postBody);
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
let convertMessage = function(message){
	message = encodeURI(message).replace(/%20/g,"rek");
	return message;
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
			requestMessage = "name " + convertMessage(input.message);
			session[input.user]["currentFlow"] = "create.name";
			sendMessageToGG(requestMessage, input.user, [], (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = null;
				}
				res.send(reponseMess);
			});
		}
		else if(session[input.user]["currentFlow"] === "create.name"){
			requestMessage = "address " + convertMessage(input.message);
			session[input.user]["currentFlow"] = "create.address";
			sendMessageToGG(requestMessage, input.user, [], (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.name";
				}
				res.send(reponseMess);
			});
		}
		else if(session[input.user]["currentFlow"] === "create.address"){
			requestMessage = "city " + convertMessage(input.message);
			session[input.user]["currentFlow"] = "create.city";
			sendMessageToGG(requestMessage, input.user, [], (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.address";
				}
				res.send(reponseMess);
			});
		}
		else if(session[input.user]["currentFlow"] === "create.city"){
			requestMessage = "investor " + convertMessage(input.message);
			session[input.user]["currentFlow"] = "create.investor";
			sendMessageToGG(requestMessage, input.user, [], (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.city";
				}
				res.send(reponseMess);
			});
		}
		else if(session[input.user]["currentFlow"] === "create.investor"){
			requestMessage = "unit " + convertMessage(input.message);
			session[input.user]["currentFlow"] = "create.unit";
			sendMessageToGG(requestMessage, input.user, [], (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.investor";
				}
				res.send(reponseMess);
			});
		}
		else if(session[input.user]["currentFlow"] === "create.unit"){
			requestMessage = "type " + convertMessage(input.message);
			session[input.user]["currentFlow"] = "create.type";
			sendMessageToGG(requestMessage, input.user, [], (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.unit";
				}
				res.send(reponseMess);
			});
		}
		else if(session[input.user]["currentFlow"] === "create.type"){
			requestMessage = "designType " + convertMessage(input.message);
			session[input.user]["currentFlow"] = "create.designType";
			sendMessageToGG(requestMessage, input.user, [], (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.type";
				}
				res.send(reponseMess);
			});
		}
		else if(session[input.user]["currentFlow"] === "create.designType"){
			requestMessage = "level " + convertMessage(input.message);
			session[input.user]["currentFlow"] = "create.level";
			sendMessageToGG(requestMessage, input.user, [], (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.type";
				}
				res.send(reponseMess);
			});
		}
		else if(session[input.user]["currentFlow"] === "create.level"){
			requestMessage = "level " + convertMessage(input.message);
			session[input.user]["currentFlow"] = "create.level";
			sendMessageToGG(requestMessage, input.user, [], (reponseMess) => {
				if(reponseMess.status.code != 200){
					session[input.user]["currentFlow"] = "create.designType";
				}
				res.send(reponseMess);
			});
		}
		if(session[input.user]["currentFlow"] === "create.level"){
			if(input.message === "OK"){
				delete session[input.user];
			}
			else if(input.message === "NO"){
				delete session[input.user];
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

app.get("/",function(req,res){
	res.redirect("http://redmine.vnclink.com");
});

app.listen(port,function(){
	console.log("Server is running on port " + port + ".");
});
