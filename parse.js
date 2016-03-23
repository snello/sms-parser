/*

This is an RabbitMQ consumer example for parsing SMS messages
into domain specific items (monthly parking number and time of
day)

When set to test mode we make the reference date to be 9am in
the morning so that all request messages make sense.

Run with --help to see the command line format

*/

var program = require('commander');
var chrono = require('chrono-node');

// Command-Line parsing and help
program
  .option('-h, --host <host>', 'The RabbitMQ instance to connect to, inc. :port if necessary')
  .option('-m, --mode <mode>', 'test/prod. Default is test')
  .parse(process.argv);

var host = program.host || "192.168.99.100:32769";
var mode = program.mode || "test";

// Create the RabbitMQ context
var context = require('rabbit.js').createContext('amqp://' + host);

///////////////////////////////////////////////////////////////
// RabbitMQ Consumer
///////////////////////////////////////////////////////////////
// Handle Error messages
context.on('error', function(err) {
  console.log('RabbitMQ Error:' + err);
});

// When TCP connection is ready...
context.on('ready', function() {

  // Create socket to subscribe
  var sub = context.socket('SUBSCRIBE');
  // and connect to sms channel
  sub.connect('sms');

  // Event to receive message
  sub.on('data', function(sms) {
    console.log("=================");
    console.log("New SMS! %s", sms);

    // Parse JSON into simple JSObject
    sms = JSON.parse(sms);

    // Check the message format before continuing
    if(sms.id && sms.body && sms.cli) {
      // Use Chrono to parse the datetime
      var reference_date = new Date();
      
      // if running in test mode, set the reference date to this
      // morning so that messages make sense.
      if(mode === "test") {
        reference_date.setHours(1);
      }
      var dt = chrono.parse(sms.body, reference_date);
      
      // Now remove the date time info from body to help further parsing
      var request_datetime = "UNKNOWN";
      if(dt && dt[0]) {
        request_datetime = dt[0].start.date();
        sms.body = sms.body.replace(dt[0].text, "");
      }

      var monthly_number = "UNKONWN";

      // Using the CLI, can we identify that number in the body?
      if(sms.body.indexOf(lookupMonthlyNumberByCli(sms.cli)) > -1) {
          monthly_number = lookupMonthlyNumberByCli(sms.cli);
      } else {
        // Are there any numbers left in the sms?
        var numbers = sms.body.match(/[0-9]+/);
        
        // Did we get any results?
        if(numbers && numbers.length === 1) {
          monthly_number = numbers[0];
        } else {
          // Has this cli ever been used for another monthly number?
          // If so, use that.
          if(lookupMonthlyNumberByCli(sms.cli)) {
            monthly_number = lookupMonthlyNumberByCli(sms.cli);
          }
        }
      }
      
      // Log an object containing all necessary data
      console.log(JSON.stringify({id: sms.id, monthly_number: monthly_number, date_time: request_datetime.toLocaleString()}));
      
    }

  });  

});

///////////////////////////////////////////////////////////////
// Helper functions
///////////////////////////////////////////////////////////////
function lookupMonthlyNumberByCli(cli) {
  // This is really just a placeholder for a remote lookup

  var cli_history = {
    "13474130591":315,
    "447714763252":250,
    "16467646554":999
  };

  return cli_history[cli];
}
