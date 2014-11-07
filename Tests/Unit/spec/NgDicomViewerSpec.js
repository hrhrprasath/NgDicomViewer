describe("TestimgAnnotation Tools", function () {
    var imageHandler, annotationTool;
    beforeEach(function () {
        imageHandler = new ImageHandler();
        annotationTool = new AnnotationTools();
		var canvas = document.createElement('canvas');
		canvas.width = 512;
		canvas.height = 512;
	    imageHandler.context = canvas.getContext("2d");      
        imageHandler.canvas = canvas;             
        imageHandler.currentTool = "line"; 
        imageHandler.currentColour = "blue";
        imageHandler.canvasImage = imageHandler.context.getImageData(0,0,canvas.width,canvas.height);;
		imageHandler.tag ={'PixelSpacing':1};

    });
    it("SetImageHandler test", function () {
        annotationTool.SetImageHandler(imageHandler);
        expect(annotationTool).toBeDefined();
        expect(annotationTool.context).toEqual(imageHandler.context);
        expect(annotationTool.canvas).toEqual(imageHandler.canvas);
        expect(annotationTool.currentShape).toEqual("line");
        expect(annotationTool.currentColour).toEqual("blue");
        expect(annotationTool.imageData).toEqual(imageHandler.canvasImage);
        expect(annotationTool._pixelSpacingX).toEqual(1);
        expect(annotationTool._pixelSpacingY).toEqual(1);
    });
	 it(" Start test", function () {
		var event = document.createElement('event');
		event.offsetX = 10;
		event.offsetY = 20;
	    annotationTool.Start(event);
        expect(annotationTool.isToolActive).toBeTruthy();
        expect(annotationTool.startx).toEqual(10);
        expect(annotationTool.starty).toEqual(20);
    });

});