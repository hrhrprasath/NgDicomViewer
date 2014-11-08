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
    imageHandler.canvasImage = imageHandler.context.getImageData(0, 0, canvas.width, canvas.height); ;
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
    it("Step2: Checkinking for tool Began", function () {
        var event = document.createElement('event');
        event.offsetX = 10;
        event.offsetY = 20;
        Tool.Start(event);
        expect(Tool.isToolActive).toBeTruthy();
        expect(Tool.startx).toEqual(10);
        expect(Tool.starty).toEqual(20);
    });
    it("Step3: Checkinking for tool End", function () {
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
    it("Step4: Checkinking for tool HistoryTrack", function () {
        Tool.DrawHistory();
        expect(Tool.context).toBeDefined();
       });
});
