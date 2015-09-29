exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',

  capabilities: {
    'browserName': 'chrome'
  },
framework: 'jasmine2',
  specs: ['spec.js'],

  jasmineNodeOpts: {
    showColors: true,
	defaultTimeoutInterval: 2500000
  },
 onPrepare: function(){
                browser.driver.manage().window().maximize();  
                browser.driver.get('http://localhost:3000');
        }
};