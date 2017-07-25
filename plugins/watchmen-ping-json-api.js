var request = require('request');

function PingService(){}

exports = module.exports = PingService;

function readProp(obj, p) {
  var ps = p.split('.'), co = obj;
  for(var i = 0; i < ps.length; i++)
  {
    co = (co[ps[i]] !== undefined)? co[ps[i]] : co[ps[i]] = {};
  }
  return co;
}


PingService.prototype.ping = function(service, callback){
  var startTime = +new Date();
  var options = {
    method: 'GET',
    uri: service.url,
    timeout: service.timeout,
    headers: {
	'Content-Type': 'application/json'
    },
    poll: false
  };

  if (!service.pingServiceOptions || !service.pingServiceOptions['json-api']) {
    return callback('json-api plugin configuration is missing');
  }

  if(service.pingServiceOptions['json-api'].header) {
    try {
    var headers = JSON.parse(service.pingServiceOptions['json-api'].header.value);
    for(var name in headers) {
      options.headers[name] = headers[name];
    }
   } catch(ex) {
     return callback("invalid headers: " + service.pingServiceOptions['json-api'].header.value + "\n" + ex);
   }
  }

  var contains = null;
  var notContains = null;
  var checks = null; 

  if (service.pingServiceOptions['json-api'].contains){
    contains = service.pingServiceOptions['json-api'].contains.value;
  }
  if (service.pingServiceOptions['json-api'].notContains){
    notContains = service.pingServiceOptions['json-api'].notContains.value;
  }
  if (service.pingServiceOptions['json-api'].check && service.pingServiceOptions['json-api'].check.value){
    checks = service.pingServiceOptions['json-api'].check.value.split(";");
    if(checks.length === 3) {
      checks = {
	  field : checks[0],
	  comparator : checks[1],
	  value : isNaN(checks[2])?checks[2]:Number(checks[2])
      };
    } else
     checks = null;
  }

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  request(options, function(error, response, body){

    var elapsedTime = +new Date() - startTime;
    if (error) {
      return callback(error, body, response, elapsedTime);
    }

    // lets see what checks we need to do
    var ok = null;

    if (contains && body.indexOf(contains) === -1) {
      ok = contains + ' not found';
    }
    if(!ok && notContains && body.indexOf(notContains) > -1) {
      ok = notContains + ' found';
    }
    if(!ok && checks) {
      // parse response
      var content;
      try {
	  content = JSON.parse(body);
      } catch (ex) {
          return callback("invalid body: " + body + "\n" + ex);
      }

      // get the right field
      var val = readProp(content, checks.field);
      var ok = false;
      switch(checks.comparator) {
        case "eq":
          ok = (val == checks.value)?null:(checks.field + ": " + checks.value + "!=" + JSON.stringify(val));
          break;
        case "gt":
          ok = (Number(val) > checks.value)?null:(checks.field + ": " + checks.value + ">" + JSON.stringify(val));
          break;
        case "lt":
          ok = (Number(val) < checks.value)?null:(checks.field + ": " + checks.value + "<" + JSON.stringify(val));
          break;
      }
    }

    return callback(ok, body, response, elapsedTime);
  });
};

PingService.prototype.getDefaultOptions = function(){
  return {
	header:  {
		descr: 'additional api http header (use json form: {"header":"value"}',
		required: false
	},

	contains: {
		descr: 'string that must be in the response',
		required: false
	},

	notContains: {
	      descr: 'response body must NOT contain',
	      required: false
	},

        check: {
                descr: 'json checks: obj.field;[eq,gt,lt];val',
                required: false 
        }

  };
}
