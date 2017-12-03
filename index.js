const http = require('http');
const express = require('express');

var app = express();
var session = [];
var flow = {
	"create" : {
		"name" : "",
		"address" : "",
		"city" : "",
		"investor" : "",
		"unit" : "",
		"type" : "",
		"designType" : "",
		"level" : "" 
	}
};
var getValue = function(obj, path){
	if(typeof obj !== "object"){
		return null;
	}
	var keys = path.split(".");
	var keysLength = keys.length;
	var tempObj = Object.assign({},obj);
	for(var i = 0; i < keysLength; i++){
		tempObj = tempObj[keys[i]];
		if(!tempObj || (typeof tempObj !== "object" && i < keysLength - 2)){
			return null;
		}
	}
	return tempObj;
}


const port = 3000;
const CLIENT_TOKEN = "";
const DEV_TOKEN = "";
const bodyParser = require('body-parser');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/sendMessage",function(req, res){
   var input = req.body;
   if(input.flow === "create"){
	if(!session[input.user]["create"]){
		session[input.user]["create"] = Object.assign({}, flow.create);
		session[input.user]["currentFlow"] = null;
	}
	var requestMessage = "";
	if(session[input.user]["currentFlow"] === null){
		requestMessage = "name " + input.message;
		session[input.user]["currentFlow"] = "create.name"; 
	}
	else if(session[input.user]["currentFlow"] === "create.name")
	
   }
   else if(input.flow === "update"){
	
   }
});

app.get("/",function(req,res){
   res.redirect("http://redmine.vnclink.com");
});

app.listen(port,function(){
   console.log("Server is running on port " + port + ".");
});
