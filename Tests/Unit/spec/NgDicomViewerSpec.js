///TODO:better testing spec with url file support since local file loading is abandoned 

describe("Annotation Tools", function () {
    var imageHandler, Tool;
    imageHandler = new ImageHandler();
    Tool = new AnnotationTools();
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    imageHandler.context = canvas.getContext("2d");
    imageHandler.canvas = canvas;
    imageHandler.currentTool = "line";
    imageHandler.currentColour = "blue";
    imageHandler.canvasImage = imageHandler.context.getImageData(0, 0, canvas.width, canvas.height);
    imageHandler.tag = { 'PixelSpacing': 1 };

    it("Step1: Checking for Object Asssiginments", function () {
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

    it("Step3: Checking for tool End", function () {
        var event = document.createElement('event');
        event.offsetX = 100;
        event.offsetY = 200;
        Tool._isMouseMoved = true;
        Tool.Stop(event);
        expect(Tool.isToolActive).not.toBeTruthy();
        expect(imageHandler.annotationHistory.length).toEqual(1);
        expect(imageHandler.annotationHistory[0].startX).toEqual(10);
        expect(imageHandler.annotationHistory[0].startY).toEqual(20);
        expect(imageHandler.annotationHistory[0].endX).toEqual(100);
        expect(imageHandler.annotationHistory[0].endY).toEqual(200);
        expect(imageHandler.annotationHistory[0].colour).toEqual("blue");
        expect(imageHandler.annotationHistory[0].shape).toEqual("line");
        expect(imageHandler.annotationHistory[0].AreaStr).not.toEqual("");
    });

    it("Step4: Checking for tool HistoryTrack", function () {
        Tool.DrawHistory();
        expect(Tool.context).toBeDefined();
    });
});

describe("WindowLevel Tool", function () {
    var imageHandler, Tool;
    imageHandler = new ImageHandler();
    Tool = new WindowLevelTool();
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    imageHandler.context = canvas.getContext("2d");
    imageHandler.canvas = canvas;
    imageHandler.currentTool = "rainbow";
    imageHandler.canvasImage = imageHandler.context.getImageData(0, 0, canvas.width, canvas.height);

    it("Step1: Checking for Object Asssiginments", function () {
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
    imageHandler = new ImageHandler();
    Tool = new FilterTool();
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    imageHandler.context = canvas.getContext("2d");
    imageHandler.canvas = canvas;
    imageHandler.canvasImage = imageHandler.context.getImageData(0, 0, canvas.width, canvas.height);

    it("Step1: Checking for Object Asssiginments", function () {
        Tool.SetImageHandler(imageHandler);
        expect(Tool).toBeDefined();
        expect(Tool.context).toEqual(imageHandler.context);
        expect(Tool.canvas).toEqual(imageHandler.canvas);
        expect(Tool.viewer).toBeNull();
        expect(Tool.imageHandler).toEqual(imageHandler);
    });

    it("Step2: Checking for Sobel", function () {
        expect(Tool.Sobel).toBeDefined();
    });

    it("Step3: Checking for Sharpen", function () {
        expect(Tool.Sharpen).toBeDefined();
    });

});

describe("ImageHandler", function () {
    var handler;
    handler = new ImageHandler();
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    var context = canvas.getContext("2d");
    var canvasImage = context.getImageData(0, 0, canvas.width, canvas.height);

    it("Step1: Checking for Object Asssiginments", function () {
        var obj = { 'testName': 'Viewer' }
        obj.getImage = function () { return "test"; }
        handler.SetViewer(obj);
        var tagObj = {}
        tagObj.PixelSpacing = 1;
        handler.SetTag(tagObj);
        handler.SetCanvas(canvas);
        handler.SetCanvasImage(canvasImage);
        handler.SetToolParam("line", "green");
        expect(handler).toBeDefined();
        expect(handler.GetViewer().testName).toEqual("Viewer");
        expect(handler.tag.PixelSpacing).toEqual(1);
        expect(handler.GetCanvas()).toEqual(canvas);
        expect(handler.GetCanvasImage()).toEqual(canvasImage);
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
    imageHandler = new ImageHandler();
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    imageHandler.context = canvas.getContext("2d");
    imageHandler.canvas = canvas;
    imageHandler.currentTool = "rainbow";
    imageHandler.canvasImage = imageHandler.context.getImageData(0, 0, canvas.width, canvas.height);

    it("Step1: Checking for Object Asssiginments", function () {
        var tagObj = {}
        tagObj.PixelSpacing = 1;
        imageHandler.SetTag(tagObj);
        handler.SetImageHandler(imageHandler);
        expect(handler).toBeDefined();
        expect(handler.imagehandler).toEqual(imageHandler);
        expect(handler.imagehandler.tag.PixelSpacing).toEqual(1);
    });

    it("Step2: Checking for Tools", function () {
        expect(handler.GetAnnotationTool().imageHandler).toEqual(imageHandler);
        expect(handler.GetWindowLevelTool().imageHandler).toEqual(imageHandler);
        expect(handler.GetFilterTool().imageHandler).toEqual(imageHandler);
        expect(handler.GetTransformationTool().imageHandler).toEqual(imageHandler);
        expect(handler.GetAnnotationTool().imageHandler).toEqual(imageHandler);
    });

});


describe("FileHandler", function () {
    var handler, imageHandler;
    handler = FileHandler.GetInstence();
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    var parentElement = document.createElement('div');
    var filobjarr = ["file1", "file2"];
    var context = canvas.getContext("2d");
    it("Step1: Checking for Object Asssiginments and Initialzation", function () {
        expect(handler).toBeDefined();
        handler.SetElements(canvas, parentElement, function () { });
        handler.Initialize(filobjarr);
        expect(handler.fileList.length).toEqual(2);
        expect(handler.fileList[0].FileObj).toEqual("file1");
        expect(handler.fileList[0].ImageHandler).toBeDefined();
        expect(handler.fileList[1].FileObj).toEqual("file2");
        expect(handler.fileList[1].ImageHandler).toBeDefined();
    });

    it("Step2: Checking for DisplayFuncations", function () {
        var obj = { 'testName': 'Viewer' }
        imgobj = {};
        sizeobj = {};
        sizeobj.getNumberOfColumns = function () { return 512; };
        sizeobj.getNumberOfRows = function () { return 512; };
        imgobj.getSize = function () { return sizeobj; };
        obj.getImage = function () { return imgobj; };
        handler.fileList[0].ImageHandler.canvas = canvas;
        handler.fileList[0].ImageHandler.canvasImage = context.getImageData(0, 0, canvas.width, canvas.height);
        handler.fileList[0].ImageHandler.SetViewer(obj);
        handler.fileList[1].ImageHandler.canvas = canvas;
        handler.fileList[1].ImageHandler.canvasImage = context.getImageData(0, 0, canvas.width, canvas.height);
        handler.fileList[1].ImageHandler.SetViewer(obj);
        handler.SetDisplayFile(0);
        expect(handler.GetCurrentIndex()).toEqual(0);
        handler.SetDisplayFile(1);
        expect(handler.GetCurrentIndex()).toEqual(1);
    });

});
