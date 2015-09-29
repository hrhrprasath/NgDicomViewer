describe('NGDicomViewerTest', function() {
	 var element1 = null;
	it('1)loading remote image', function() {
		element( by.css('[ng-click="ishelp = false"]') ).click();
		browser.sleep(100);
		element( by.css('[ng-click = "optionState = !optionState"]') ).click();
		browser.sleep(100);
		element( by.css('[ng-click = "RemoteFile = true"]') ).click();
		browser.sleep(100);
		element( by.css('#urlsList') ).sendKeys('http://localhost:3000/SampleImage/dicom.dcm');
		browser.sleep(100);
		element( by.css('#openurlbtn') ).click();
		element1 = element(by.tagName('canvas'));

	})
	it("2)lets draw line",function(){
		browser.sleep(2000);
		browser.driver.actions().
		mouseMove(element1,{x:100,y:100}).
		mouseDown().
		mouseMove(element1,{x:150,y:100}).
		mouseUp().
		perform();
		browser.driver.actions().
		mouseMove(element1,{x:300,y:200}).
		mouseDown().
		mouseMove(element1,{x:20,y:450}).
		mouseUp().
		perform();
				
	});
	it("3)lets draw circle",function(){
		browser.sleep(2000);
	element( by.css('[ng-click="SelectedMouseTool=\'circle\'"]') ).click();
		element(by.cssContainingText('option', 'yellow')).click();
		browser.driver.actions().
		mouseMove(element1,{x:200,y:200}).
		mouseDown().
		mouseMove(element1,{x:400,y:400}).
		mouseUp().
		perform();

				
	});
	it("4)lets draw rectangle",function(){
		browser.sleep(2000);
		element( by.css('[ng-click="SelectedMouseTool=\'rectangular\'"]') ).click();
		element(by.cssContainingText('option', 'lime')).click();
		browser.driver.actions().
		mouseMove(element1,{x:150,y:150}).
		mouseDown().
		mouseMove(element1,{x:200,y:250}).
		mouseUp().
		perform();
	});
	it("5)lets do Some Wl ",function(){
		browser.sleep(2000);
		element( by.css('[ng-click="SelectedMouseTool=\'WindowLevel\'"]') ).click();
		browser.driver.actions().
		mouseMove(element1,{x:150,y:150}).
		mouseDown().
		mouseMove(element1,{x:160,y:160}).
		mouseUp().
		perform();
		browser.driver.actions().
		mouseMove(element1,{x:160,y:160}).
		mouseDown().
		mouseMove(element1,{x:170,y:170}).
		mouseUp().
		perform();
		browser.driver.actions().
		mouseMove(element1,{x:170,y:170}).
		mouseDown().
		mouseMove(element1,{x:180,y:180}).
		mouseUp().
		perform();
	});
	it("6)lets invert",function(){
		browser.sleep(2000);
		element( by.css('[ng-click="SelectedButtonTool=\'invplain\'"]') ).click();
	});
	it("7)lets plain",function(){
		browser.sleep(2000);
		element( by.css('[ng-click="SelectedButtonTool=\'plain\'"]') ).click();
	});
	it("8)lets Hot",function(){
		browser.sleep(2000);
		element( by.css('[ng-click="SelectedButtonTool=\'hot\'"]') ).click();
	});
	it("9)lets rainbow",function(){
		browser.sleep(2000);
		element( by.css('[ng-click="SelectedButtonTool=\'rainbow\'"]') ).click();
	});
	it("11)lets test",function(){
		browser.sleep(2000);
		element( by.css('[ng-click="SelectedButtonTool=\'test\'"]') ).click();
	});
	it("12)lets sharpen",function(){
		browser.sleep(2000);
		element( by.css('[ng-click="SelectedButtonTool=\'sharpen\'"]') ).click();
	});
	it("13)lets sobel",function(){
		browser.sleep(2000);
		element( by.css('[ng-click="SelectedButtonTool=\'sobel\'"]') ).click();
	});
	it("14)lets see info",function(){
		browser.sleep(2000);
		element( by.css('[ng-click = "tagState = !tagState"]') ).click();
		browser.sleep(1000);
		element( by.model('search') ).sendKeys('name');
		
	});

	it("15)lets see",function(){
		browser.sleep(2000);
	});

});