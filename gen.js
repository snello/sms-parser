/*

This is an RabbitMQ consumer example for parsing SMS messages
into domain specific items (monthly parking number and time of
day)

When set to test mode we make the reference date to be 9am in
the morning so that all request messages make sense.

Run with --help to see the command line format

*/
var program = require('commander');

// Command-Line parsing and help
program
  .option('-h, --host <host>', 'The RabbitMQ instance to connect to, inc. :port if necessary')
  .parse(process.argv);

var host = program.host || "192.168.99.100:32769";

var context = require('rabbit.js').createContext('amqp://' + host);

var sms = [
  {id: 1, body:"315 4pm today"},
  {id: 2, body:"315 2.40pm", cli:"447714763252"},
  {id: 3, body:"noon tomorrow 250", cli:"447714763252"},
  {id: 4, body:"1500 315", cli:"13474130591"},
  {id: 5, body:"I need my car at 6pm tonight", cli:"13474130591"},
  {id: 6, body:"Please have my car ready at 10am", cli:"13474130591"}
];

context.on('error', function(err) {
  console.log('hello error:' + err);
});
context.on('close', function(msg) {
  console.log("Socket is closed");
});
context.on('ready', function() {

  var pub = context.socket('PUBLISH');
  pub.connect('sms', function(){
    for(i in sms) {
      console.log("publishing message");
      pub.write(JSON.stringify(sms[i]));
    }    
  });
  

});
