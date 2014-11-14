///TODO:better testing spec with url file support since local file loading is abandoned
var imgHandler; //to store the downloaded image

describe("FileHandler", function () {
    var handler, imageHandler;
    handler = FileHandler.GetInstence();
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    var parentElement = document.createElement('div');
    //we cant check for local fie directly
    var filobjarr = ["file1", "file2"];
    var urlArray = ["http://x.babymri.org/?53320924&.dcm"];
    var context = canvas.getContext("2d");
	var originalTimeout;
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
    it("Step1: Checking for Object Asssiginments and Initialzation", function () {
        expect(handler).toBeDefined();
        handler.SetElements(canvas, parentElement, function () { });
        handler.InitializeFiles(filobjarr);
        expect(handler.fileList.length).toEqual(2);
        expect(handler.fileList[0].FileObj).toEqual("file1");
        expect(handler.fileList[0].ImageHandler).toBeDefined();
        expect(handler.fileList[1].FileObj).toEqual("file2");
        expect(handler.fileList[1].ImageHandler).toBeDefined();
    });
    it("Step2: Checking for Remotefile Initialzation", function () {
        expect(handler).toBeDefined();
        handler.SetElements(canvas, parentElement, function () { });
        handler.InitializeRemoteFiles(urlArray);
        expect(handler.fileList.length).toEqual(1);
        expect(handler.fileList[0].Url).toEqual(urlArray[0]);
        expect(handler.fileList[0].ImageHandler).toBeDefined();
    });
    it("Step3: Checking for DisplayFuncations", function (done) {
        var onfileDownloaded = function () {
            expect(handler.DataArray).not.toBeNull();
            imgHandler = handler.fileList[0].ImageHandler;
            expect(imgHandler.GetCanvasImage().width).toEqual(256);
            expect(imgHandler.GetCanvasImage().height).toEqual(256);
			jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
			done();
        }
        handler.fileList[0].ImageHandler.canvas = canvas;
        handler.callBack = onfileDownloaded;
        handler.SetDisplayFile(0);
        expect(handler.GetCurrentIndex()).toEqual(0);


    });

});
describe("ImageHandler", function () {
    var handler;
   
    it("Step1: Checking for Object Asssiginments", function () {
		handler =imgHandler;
        handler.SetToolParam("line", "green");
        expect(handler).toBeDefined();
        expect(handler.GetViewer()).toEqual(imgHandler.viewer);
        expect(handler.tag.Rows.value[0]).toEqual(256);
        expect(handler.currentTool).toEqual("line");
        expect(handler.currentColour).toEqual("green");

    });

    it("Step2: Checking for Tools", function () {
        expect(handler.GetAnnotationTool().imageHandler).toEqual(handler);
        expect(handler.GetWindowLevelTool().imageHandler).toEqual(handler);
        expect(handler.GetFilterTool().imageHandler).toEqual(handler);
        expect(handler.GetTransformationTool().imageHandler).toEqual(handler);
        expect(handler.GetAnnotationTool().imageHandler).toEqual(handler);
    });

});


describe("ToolHandler", function () {
    var handler, imageHandler;
    handler = ToolHandler.GetInstence();
    it("Step1: Checking for Object Asssiginments", function () {
		imageHandler = imgHandler;
		handler.SetImageHandler(imageHandler);
        expect(handler).toBeDefined();
        expect(handler.imagehandler).toEqual(imageHandler);
        expect(handler.imagehandler.tag.Rows.value[0]).toEqual(256);
    });

    it("Step2: Checking for Tools", function () {
        expect(handler.GetAnnotationTool().imageHandler).toEqual(imageHandler);
        expect(handler.GetWindowLevelTool().imageHandler).toEqual(imageHandler);
        expect(handler.GetFilterTool().imageHandler).toEqual(imageHandler);
        expect(handler.GetTransformationTool().imageHandler).toEqual(imageHandler);
        expect(handler.GetAnnotationTool().imageHandler).toEqual(imageHandler);
    });

});

describe("Annotation Tools", function () {
    var imageHandler, Tool;
    imageHandler = new ImageHandler();
    Tool = new AnnotationTools();
  it("Step1: Checking for Object Asssiginments", function () {
		imageHandler =imgHandler;
		imageHandler.currentTool = "line";
		imageHandler.currentColour = "blue";
        Tool.SetImageHandler(imageHandler);
        expect(Tool).toBeDefined();
        expect(Tool.context).toEqual(imageHandler.context);
        expect(Tool.canvas).toEqual(imageHandler.canvas);
        expect(Tool.currentShape).toEqual("line");
        expect(Tool.currentColour).toEqual("blue");
        expect(Tool.imageData).toEqual(imageHandler.canvasImage);
        expect(Tool._pixelSpacingX).toEqual(1);
        expect(Tool._pixelSpacingY).toEqual(1);
    });

    it("Step2: Checking for tool Began", function () {
        var event = document.createElement('event');
        event.offsetX = 10;
        event.offsetY = 20;
        Tool.Start(event);
        expect(Tool.isToolActive).toBeTruthy();
        expect(Tool.startx).toEqual(10);
        expect(Tool.starty).toEqual(20);
       
    });
	 it("Step3: Checking for tool move", function () {
        var event = document.createElement('event');
        event.offsetX = 11;
        event.offsetY = 22;
        Tool.Track(event);
        expect(Tool.isToolActive).toBeTruthy();
        expect(Tool._isMouseMoved).toBeTruthy();
       
    });

    it("Step4: Checking for tool End", function () {
        var event = document.createElement('event');
        event.offsetX = 20;
        event.offsetY = 30;
        Tool._isMouseMoved = true;
        Tool.Stop(event);
        expect(Tool.isToolActive).not.toBeTruthy();
        expect(imageHandler.annotationHistory.length).toEqual(1);
        expect(imageHandler.annotationHistory[0].startX).toEqual(10);
        expect(imageHandler.annotationHistory[0].startY).toEqual(20);
        expect(imageHandler.annotationHistory[0].endX).toEqual(20);
        expect(imageHandler.annotationHistory[0].endY).toEqual(30);
        expect(imageHandler.annotationHistory[0].colour).toEqual("blue");
        expect(imageHandler.annotationHistory[0].shape).toEqual("line");
        expect(imageHandler.annotationHistory[0].AreaStr).not.toEqual("14.124mm");
    });	

    it("Step5: Checking for tool HistoryTrack", function () {
        Tool.DrawHistory();
        expect(Tool.context).toBeDefined();
    });
});

describe("WindowLevel Tool", function () {
    var imageHandler, Tool;
    Tool = new WindowLevelTool();
    
    it("Step1: Checking for Object Asssiginments", function () {
        imageHandler =imgHandler;
		imageHandler.currentTool = "rainbow";
		Tool.SetImageHandler(imageHandler);
        expect(Tool).toBeDefined();
        expect(Tool.context).toEqual(imageHandler.context);
        expect(Tool.canvas).toEqual(imageHandler.canvas);
    });

    it("Step2: Checking for tool Began", function () {
        var event = document.createElement('event');
        event.offsetX = 10;
        event.offsetY = 20;
        Tool.Start(event);
        expect(Tool.isActive).toBeTruthy();
        expect(Tool.startX).toEqual(10);
        expect(Tool.startY).toEqual(20);
        expect(Tool.maptoolName).toEqual("rainbow");
    });

    it("Step3: Checking for tool End", function () {
        var event = document.createElement('event');
        event.offsetX = 100;
        event.offsetY = 200;
        Tool._isMouseMoved = true;
        Tool.Stop(event);
        expect(Tool.isActive).not.toBeTruthy();
    });

});

describe("FilterTool Tool", function () {
    var imageHandler, Tool;
    Tool = new FilterTool();
    it("Step1: Checking for Object Asssiginments", function () {
		imageHandler =imgHandler;
		Tool.SetImageHandler(imageHandler);
        expect(Tool).toBeDefined();
        expect(Tool.context).toEqual(imageHandler.context);
        expect(Tool.canvas).toEqual(imageHandler.canvas);
        expect(Tool.viewer).not.toBeNull();
        expect(Tool.imageHandler).toEqual(imageHandler);
    });

    it("Step2: Checking for Sobel", function () {
        expect(Tool.Sobel).toBeDefined();
    });

    it("Step3: Checking for Sharpen", function () {
        expect(Tool.Sharpen).toBeDefined();
    });

});




