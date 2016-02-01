
var
    string      = require('string'),
    express 	= require('express'),
	app     	= express(),
    fs = require('fs'),
    formidable = require('formidable'),
	config  	= {
		applicationRoute : "http://v-app.mybluemix.net",
		applicationId : "v-app"
	},
    ibmbluemix 	= require('ibmbluemix'),
    watson = require('watson-developer-cloud'),
    language_translation = watson.language_translation({
                                                   username: '27e301e2-019f-42de-8d64-531e59596c71',
                                                   password: 'APXHDQvTGXPM',
                                                   version: 'v2'
                                                   }),
    visual_recognition = watson.visual_recognition({
                                                   username: '54e6b8c5-3c78-4b6e-a762-75071a270e3e',
                                                   password: '80PcKrRS4nvm',
                                                   version: 'v1-beta'
                                                   }),
    Cloudant = require('cloudant'),
    cloudant = Cloudant({
                        host: "19c3624f-3f57-4f5f-9ba6-8914d9e1138f-bluemix.cloudant.com",
                        port: 443,
                        url: "https://19c3624f-3f57-4f5f-9ba6-8914d9e1138fbluemix:fe09cfbc4ebb2e2bb4a58b636959c450f01fe5b715e2a40cdaf8ddfa87ba34f8@19c3624f-3f57-4f5f-9ba6-8914d9e1138fbluemix.cloudant.com",
                        username: '19c3624f-3f57-4f5f-9ba6-8914d9e1138f-bluemix',
                        password: 'fe09cfbc4ebb2e2bb4a58b636959c450f01fe5b715e2a40cdaf8ddfa87ba34f8'
                 });

// init core sdk
ibmbluemix.initialize(config);
var logger = ibmbluemix.getLogger();

app.get('/apps', function(req, res){
	res.sendfile('public/apps.html');
});

app.post('/upload', function(req, result) {
	
	//console.log('uploads');
	
	var form = new formidable.IncomingForm();
	form.keepExtensions = true;
	
    form.parse(req, function(err, fields, files) {
		var params = {
			image_file: fs.createReadStream(files.image.path)
		};
	 
		visual_recognition.recognize(params, function(err, res) {

            var results = [];
            for(var i=0;i<res.images[0].labels.length;i++) {
				results.push(res.images[0].labels[i].label_name);  
            }

            result.send("<h1>Visual Recognition Results</h1>"+results.join(', '));

        });

    });
	
});

app.post('/translate', function(req, result) {
         
    var form = new formidable.IncomingForm();
    form.keepExtensions = true;
         
    form.parse(req, function(err, fields, files) {
               
        console.log(fields);
        
        language_translation.translate({
                                       
                text: fields.text, source : 'en', target: 'es' },
                                       
                function (err, translation) {
                    
                    console.log(translation);
                                       
                    if (err)
                        console.log('error:', err);
                    else
                        console.log(JSON.stringify(translation, null, 2));
                                       
                                       var vDb = cloudant.db.use('v-db');

                                       vDb.insert(translation, function (er, resultDb) {
                                                 if (er) {
                                                  console.log("error: "+er);
                                                  throw er;
                                                 }
                                       });
                
                    result.send("<h1>Language Translation Results</h1>" + translation.translations[0].translation );
               
        });
         
    });

});


// init services

app.use(function(req, res, next) {
    req.logger = logger;
    next();
});

app.use(require('./lib/setup'));

var ibmconfig = ibmbluemix.getConfig();

app.use(ibmconfig.getContextRoot(), require('./lib/staticfile'));

app.listen(ibmconfig.getPort());
