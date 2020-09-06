var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var dns = require('dns');

var mongoose = require('mongoose');
var mongodb = require('mongodb');
var Schema = mongoose.Schema;

//mongodb+srv://zigotaTestova:qN12HlAtSTYce87V@cluster0.a6zzn.mongodb.net/Cluster0?retryWrites=true&w=majority
const password = '**********';

mongoose.connect('mongodb+srv://zigotaTestova:**********@cluster0.a6zzn.mongodb.net/Cluster0?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true }); 


var counter = 0;

var URLs = new Schema({
    original_url: String,
    short_url: String
})

const url_model = mongoose.model("URLs", URLs);
// url_model.deleteMany({short_url: /\d+/}, (err,data)=>{
//     if(err){
//         console.log("DELETEMANY")
//     }
// })

app.use(bodyParser.urlencoded({extended: false}));

const absolutePath = __dirname + "/views/index.html";
app.get('/', (req,res)=>{res.sendFile(absolutePath)})

app.post('/api/shorturl/new', (req,res)=>{
    const orig = req.body.original_url;
    const valid = /https:\/\/www\.\w+\.com|https:\/\/www\.\w+\.org/i;
    const p = valid.test(orig);

    if(p){
        const reg = /www\.\w+\.com|www\.\w+\.org/i;
        const mat = orig.match(reg);

        dns.lookup(mat[0], function(err){
            if(err != null){
                res.json({"error":"invalid URL"})
            }
            else{
                url_model.findOne({original_url: orig}, function(err, data){
                    //console.log("Data: ", data)
                    if(err){
                        res.json({"error":"on findOne"})
                    }
                    else if(data == null){
                        counter += 1;
                        console.log("Creating New Doc.................");

                        const url_doc = new url_model({
                                original_url: orig,
                                short_url: counter.toString()
                            }
                        );
                        url_doc.save((err,data)=>{
                            if(err){
                                res.json({"error":"on save"})
                            }
                            res.json({
                                original_url: orig,
                                short_url: data.short_url
                                }
                            );
                        })
                    }
                    else{
                        console.log("requesting Index from DB...................")
                        res.json({
                            original_url: orig,
                            short_url: data.short_url
                            }
                        );
                    }
                })
            }
        })
    }
    else{
        res.json({"error":"invalid URL"})
    }
})

app.get('/api/shorturl/new/:short_url', (req,res)=>{
    url_model.findOne({short_url: req.params.short_url.toString()}, function(err,data){
        if(err){
            console.log(err)
            res.json({"error": "on GET short_url"})
        }
        else if(data == null){
            res.json({"db":"no such site in db"})
        }
        else{
            console.log("~~~~~REDIRECT TO: ",data.original_url)
            res.redirect(301, data.original_url);
        }
    })  
})

const ab = __dirname + "/public/css"
app.use(express.static(ab))


app.listen(3000, ()=>console.log("Server is now running"));
