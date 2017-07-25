var colors = require('colors');
var email = require("emailjs");
var moment = require('moment');
var fs = require("fs");
var Handlebars = require('handlebars');
var server = email.server.connect({
	user: "???@gmail.com",
	password: "mypersonalpassword",
	host: "smtp.gmail.com",
	port: 465,
	ssl: true
});
var from = "monitoring@localhost";

var eventHandlers = {

  /**
   * On a new outage
   * @param {Object} service
   * @param {Object} outage
   * @param {Object} outage.error check error
   * @param {number} outage.timestamp outage timestamp
   */

  onNewOutage: function (service, outage) {
    var errorMsg = service.name + ' down!'.red + '. Service: ' + JSON.stringify(service, null, " ") + 'Error: ' + JSON.stringify(outage, null, " ").red;
    var html = Handlebars.compile(""+fs.readFileSync("templates/outage.html.mustache"))({service: service, outage: outage});
    var text = Handlebars.compile(""+fs.readFileSync("templates/outage.text.mustache"))({service: service, outage: outage});
    if(service.alertTo && service.alertTo.indexOf('@') !== -1) {
      server.send({
	text: text,
	from: from,
	to: service.alertTo,
	subject: "[MONITORING] " + service.name + " down",
	attachment:  [
		{data: html, alternative: true}
	]	
     });
    }
  },

  /**
   * Failed ping on an existing outage
   * @param {Object} service
   * @param {Object} outage
   * @param {Object} outage.error check error
   * @param {number} outage.timestamp outage timestamp
   */

  onCurrentOutage: function (service, outage) {
  },

  /**
   * Failed check (it will be an outage or not according to service.failuresToBeOutage
   * @param {Object} service
   * @param {Object} data
   * @param {Object} data.error check error
   * @param {number} data.currentFailureCount number of consecutive check failures
   */

  onFailedCheck: function (service, data) {
  },

  /**
   * Warning alert
   * @param {Object} service
   * @param {Object} data
   * @param {number} data.elapsedTime (ms)
   */

  onLatencyWarning: function (service, data) {
  },

  /**
   * Service is back online
   * @param {Object} service
   * @param {Object} lastOutage
   * @param {Object} lastOutage.error
   * @param {number} lastOutage.timestamp (ms)
   */

  onServiceBack: function (service, lastOutage) {
    var duration = moment.duration((+new Date() - lastOutage.timestamp)/1000, 'seconds');
    console.log(service.name.white + ' is back'.green + '. Down for '.gray + duration.humanize().white);

    var html = Handlebars.compile(""+fs.readFileSync("templates/serviceback.html.mustache"))({service: service, duration: duration.humanize()});
    var text = Handlebars.compile(""+fs.readFileSync("templates/serviceback.text.mustache"))({service: service, duration: duration.humanize()});
    if(service.alertTo && service.alertTo.indexOf('@') !== -1) {
      server.send({
        text: text,
        from: from,
        to: service.alertTo,
        subject: "[MONITORING] " + service.name + " is back after " + duration.humanize(),
        attachment:  [
                {data: html, alternative: true}
        ]
     });
    }
  },

  /**
   * Service is responding correctly
   * @param {Object} service
   * @param {Object} data
   * @param {number} data.elapsedTime (ms)
   */
  onServiceOk: function (service, data) {
  }
};

function ConsolePlugin(watchmen) {
  watchmen.on('new-outage', eventHandlers.onNewOutage);
//  watchmen.on('current-outage', eventHandlers.onCurrentOutage);
//  watchmen.on('service-error', eventHandlers.onFailedCheck);

//  watchmen.on('latency-warning', eventHandlers.onLatencyWarning);
  watchmen.on('service-back', eventHandlers.onServiceBack);
//  watchmen.on('service-ok', eventHandlers.onServiceOk);
}

exports = module.exports = ConsolePlugin;
