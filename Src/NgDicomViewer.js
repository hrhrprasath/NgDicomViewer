var ngDicomViewer = angular.module('ngdicomviewer', []);
var dwv = dwv || {};
dwv.dicom = dwv.dicom || {};
ngDicomViewer.controller('dicomcontroller', function ($scope, $rootScope, $document, $window) {
    $scope.Tool = ["circle", "line", "rectangular", "ellipse", "WindowLevel", "plain", "invplain", "rainbow", "hot", "test", "sharpen", "sobel","threshold","reset image","clear","clearAnnotation"];//Todo:better reset opoeration
    $scope.Colours = ['red', 'lime', 'blue', 'yellow', 'orange', 'aqua', 'fuchsia', 'white', 'black',
     'gray', 'grey', 'silver', 'maroon', 'olive', 'green', 'teal', 'navy', 'purple'];
    $scope.SelectedColor = 'red';
    $scope.SelectedMouseTool = "line";
	$scope.SelectedButtonTool = "";
    $scope.RemoteFile = false;

});
ngDicomViewer.directive("dicomviewer", function ($document, $compile, $rootScope) {
    return {
        restrict: "E",
        link: function (scope, element, attrs) {
            var angularCanvas = angular.element('<canvas style="top:0%;left:0%; position: relative;margin:0px;padding: 0px;background-color: black;"></canvas> ');
            angularCanvas[0].width = attrs["canvaswidth"] || 512;
            angularCanvas[0].height = attrs["canvasheight"] || 512;

            element[0].style.width = (attrs["canvaswidth"] || 512) + 'px';
            element[0].style.height = (attrs["canvasheight"] || 512) + 'px';

            $compile(angularCanvas)(scope);
            element.append(angularCanvas);

            //@ tools and Shapes part-------------------<
            //            var currentShape = attrs["tool"];
            //            var currentColour = attrs["colour"];
            $rootScope.Tag = [];

            $rootScope.Rmin = 0;
            $rootScope.Rmax = 100;
            var view = null;
            var filehandler = null
            var imagehandler = null;
            var isThresholdOn = false;
            scope.$watch('SelectedButtonTool', function (newval, oldval) {
                if (newval != oldval && newval) {
                    isThresholdOn = false;
                    if (!imagehandler)//imageData
                    {
                        scope.SelectedButtonTool = "";
                        return false;
                    }
                    if (!imagehandler.GetCanvasImage())//imageData
                    {
                        scope.SelectedButtonTool = "";
                        return false;
                    }
                    if (newval == "plain" || newval == "invplain" || newval == "rainbow" || newval == "hot" || newval == "test") {
                        imagehandler.SetToolParam(newval);
                        imagehandler.GetWindowLevelTool().ChangeColorMap();
                    }
                    if (newval == "sharpen") {
                        imagehandler.GetFilterTool().Sharpen(); //SetViewer(view,angularCanvas[0],angularCanvas[0].getContext("2d"));
                    }
                    if (newval == "sobel") {
                        imagehandler.GetFilterTool().Sobel();
                    }
                    if (newval == "reset image") {
                        var index = filehandler.GetCurrentIndex();
                        filehandler.ResetCurrentImage(index);
                        imagehandler = filehandler.GetCurrentImageHandler();
                        imagehandler.annotationHistory.length = 0;
                    }
                    if (newval == "threshold") {
                        isThresholdOn = true;
                        imagehandler.GetFilterTool().Threshold();
                    }
                    if (newval == 'clear') {
                        imagehandler = null;
                        $rootScope.Tag = [];
                        $rootScope.PatientName = "";
                        $rootScope.PatientId = "";
                        $rootScope.WWidth = "";
                        $rootScope.WCenter = "";
                        $rootScope.Rmin = 0;
                        $rootScope.Rmax = 100;
                        tags = null;
                        if (angularCanvas)
                            angularCanvas[0].width = angularCanvas[0].width;
                    }
                    if (newval == 'clearAnnotation') {
                        if (imagehandler)
                            imagehandler.ClearAnnotation();
                    }
                    if (newval != "threshold")
                        scope.SelectedButtonTool = "";
                }
            });

            $rootScope.$watch('Tval.min', function (newval, oldval) {
                if (newval != oldval) {
                    if (isThresholdOn) {
                        imagehandler.thresholdRange.min = newval;
                        imagehandler.GetFilterTool().Threshold();
                    }
                }
            });
            $rootScope.$watch('Tval.max', function (newval, oldval) {
                if (newval != oldval) {
                    if (isThresholdOn) {
                        imagehandler.thresholdRange.max = newval;
                        imagehandler.GetFilterTool().Threshold();
                    }
                }
            });

            //            var buttonTool = function () {
            //                if (!imagehandler.GetCanvasImage())//imageData
            //                    return false;
            //                if (attrs["tool"] == "plain" || attrs["tool"] == "invplain" || attrs["tool"] == "rainbow" || attrs["tool"] == "hot" || attrs["tool"] == "test") {
            //                    imagehandler.SetToolParam(attrs["tool"]);
            //                    imagehandler.GetWindowLevelTool().ChangeColorMap();
            //                }
            //                if (attrs["tool"] == "sharpen") {
            //                    imagehandler.GetFilterTool().Sharpen(); //SetViewer(view,angularCanvas[0],angularCanvas[0].getContext("2d"));
            //                }
            //                if (attrs["tool"] == "sobel") {
            //                    imagehandler.GetFilterTool().Sobel();
            //                }
            //                if (attrs["tool"] == "reset image") {
            //                 //   imagehandler.ResetAll();
            //                 var index = filehandler.GetCurrentIndex();
            //                 filehandler.ResetCurrentImage(index);
            //                 imagehandler = filehandler.GetCurrentImageHandler();
            //                 imagehandler.annotationHistory.length = 0;
            //                }
            //                if (attrs["tool"] == "threshold") {
            ////                    imagehandler.thresholdRange.min = parseInt($rootScope.Tmin);
            ////                    imagehandler.thresholdRange.max = parseInt($rootScope.Tmax);
            //                    imagehandler.GetFilterTool().Threshold();
            //                }
            //            };

            var mouseDown = function (event) {
                if (!imagehandler)
                    return false;
                if (!imagehandler.GetCanvasImage())//imageData
                    return false;
                if (scope.SelectedMouseTool != "WindowLevel") {
                    imagehandler.SetToolParam(scope.SelectedMouseTool, scope.SelectedColor);
                    imagehandler.GetAnnotationTool().Start(event);
                }
                else {
                    imagehandler.GetWindowLevelTool().Start(event);
                }

            }

            var mouseMove = function (event) {
                if (!imagehandler)
                    return false;
                if (!imagehandler.GetCanvasImage())//imageData
                    return false;
                if (scope.SelectedMouseTool != "WindowLevel") {
                    imagehandler.GetAnnotationTool().Track(event);
                }
                else {
                    imagehandler.GetWindowLevelTool().Track(event);
                }
            }

            var mouseUp = function (event) {
                if (!imagehandler)
                    return false;
                if (!imagehandler.GetCanvasImage())//imageData
                    return false;
                if (scope.SelectedMouseTool != "WindowLevel") {
                    imagehandler.GetAnnotationTool().Stop(event);
                }
                else {
                    imagehandler.GetWindowLevelTool().Stop(event);
                    scope.$apply(function () {
                        $rootScope.WWidth = imagehandler.GetViewer().getWindowLut().getWidth();
                        $rootScope.WCenter = imagehandler.GetViewer().getWindowLut().getCenter();
                    });
                }
                event.stopPropagation();
            }

            element.bind('mousedown', mouseDown);
            element.bind('mousemove', mouseMove);
            element.bind('mouseup', mouseUp);
            element.bind('mouseleave', mouseUp);

            //            var applybtn = angular.element(document.getElementById(attrs["applybtnid"]));
            //            if (applybtn) {
            //                applybtn.bind("click", buttonTool);
            //            }

            var mouseWheel = function (event) {
                //ToDo: Zoom in and zoom out logic pending
                //imagehandler.GetTransformationTool().Start(e,imageData);
                if (!filehandler)
                    return;
                //image loading
                if (event.wheelDelta < 0) {
                    var idx = filehandler.GetCurrentIndex();
                    if ((idx + 1) < (filehandler.fileList.length)) {
                        filehandler.SetDisplayFile(idx + 1);
                        imagehandler = filehandler.GetCurrentImageHandler();
                        fileChangeUpdate();
                    }
                }
                else {
                    var idx = filehandler.GetCurrentIndex();
                    if (idx && (idx < (filehandler.fileList.length))) {
                        filehandler.SetDisplayFile(idx - 1);
                        imagehandler = filehandler.GetCurrentImageHandler();
                        fileChangeUpdate();
                    }

                }
				event.stopPropagation();
				event.preventDefault();
            };
            angularCanvas.bind('mousewheel', mouseWheel);
            ///@End of Shapes------------------------------------->

            ///Dicom File Handling----------------<
            var fileUtilityElement = angular.element(document.getElementById(attrs["fileutilityid"]));
            var fileChangeUpdate = function () {
                scope.$apply(function () {
                    $rootScope.Tag = imagehandler.GetFilteredTags();
                    $rootScope.PatientName = imagehandler.tag.PatientName.value.toString();
                    $rootScope.PatientId = imagehandler.tag.PatientID.value.toString();
                    $rootScope.WWidth = imagehandler.GetViewer().getWindowLut().getWidth();
                    $rootScope.WCenter = imagehandler.GetViewer().getWindowLut().getCenter();
                    $rootScope.Rmin = imagehandler.GetViewer().getImage().getDataRange().min;
                    $rootScope.Rmax = imagehandler.GetViewer().getImage().getDataRange().max;
                    $rootScope.Tval = imagehandler.thresholdRange;

                });
            };
            var onFileListChanged = function (event) {
                var filesArray = event.target.files;
                clear();

                filehandler = FileHandler.GetInstence();
                filehandler.SetElements(angularCanvas[0], element[0], fileChangeUpdate);
                filehandler.InitializeFiles(filesArray);
                filehandler.SetDisplayFile(0);
                imagehandler = filehandler.GetCurrentImageHandler();
            }

            fileUtilityElement.bind('change', onFileListChanged);

            ///@End Of Dicom File Handling---------->

            ///Remote Dicom File Handling----------------<
            var urlList = angular.element(document.getElementById(attrs["urllistid"]));
            var openUrlBtn = angular.element(document.getElementById(attrs["urlopenbtnid"]));

            var RemoteFileLoad = function () {
                filehandler = FileHandler.GetInstence();
                filehandler = FileHandler.GetInstence();
                filehandler.SetElements(angularCanvas[0], element[0], fileChangeUpdate);
                var list = (urlList[0].value).split(';');
                filehandler.InitializeRemoteFiles(list); //["http://x.babymri.org/?53320924&.dcm"]
                filehandler.SetDisplayFile(0);
                imagehandler = filehandler.GetCurrentImageHandler();
            }
            if (openUrlBtn)
                openUrlBtn.bind('click', RemoteFileLoad);
            ///@End Of remote Dicom File Handling---------->

            ///@Clear All--------<
            //            var clearButton = angular.element(document.getElementById(attrs["clearbuttonid"]));
            var clear = function () {
                imagehandler = null;
                scope.$apply(function () {
                    $rootScope.Tag = [];
                    $rootScope.PatientName = "";
                    $rootScope.PatientId = "";
                    $rootScope.WWidth = "";
                    $rootScope.WCenter = "";
                    $rootScope.Rmin = 0;
                    $rootScope.Rmax = 100;
                });
                tags = null;
                if (angularCanvas)
                    angularCanvas[0].width = angularCanvas[0].width;

            }
            //            if (clearButton)
            //                clearButton.bind('click', clear);
            ///@End of Clear all------->

            ///@Clear Annotation--------<
            //            var clearAnnotationBtn = angular.element(document.getElementById(attrs["clearannotationbuttonid"]));
            //            var clearAnnotation = function () {
            //                imagehandler.ClearAnnotation();
            //            }
            //            if (clearAnnotationBtn)
            //                clearAnnotationBtn.bind('click', clearAnnotation);
            ///@End of Clear all------->

        }
    };
});

/*********************
Summary:
* @class AnnotationTools
* @namespace
* @constructor
* @param
**********************/
var AnnotationTools = (function () {
    function AnnotationTools() {
        this.context;
        this.startx;
        this.starty;
        this.canvas;
        this.isToolActive = false;
        this.toolHistory = [];
        this.currentShape;
        this.currentColour;
        this.imageData = null;
        this._pixelSpacingX = 1;
        this._pixelSpacingY = 1;
        this._isMouseMoved = false;
        this.imageHandler = null;
    }
    /**
    * To Set ImageHandler's object into current stream
    * @method SetImageHandler
    * @param {imagehandler} ImageHandler object
    * @return none
    */
    AnnotationTools.prototype.SetImageHandler = function (imagehandler) {
        if (imagehandler) {
            this.imageHandler = imagehandler;
            this.context = this.imageHandler.context;
            this.canvas = this.imageHandler.canvas;
            this.toolHistory = this.imageHandler.annotationHistory;
            this.currentShape = this.imageHandler.currentTool;
            this.currentColour = this.imageHandler.currentColour;
            this.imageData = this.imageHandler.canvasImage;
        }
        var pxlValue;
        if (this.imageHandler.tag.PixelSpacing)
            pxlValue = this.imageHandler.tag.PixelSpacing.value;
        else if (this.imageHandler.tag.ImagerPixelSpacing)
            pxlValue = this.imageHandler.tag.ImagerPixelSpacing.value;
        if (pxlValue) {
            this._pixelSpacingX = parseFloat(pxlValue[0]);
            this._pixelSpacingY = parseFloat(pxlValue[1]);
        }
    };
    /**
    * To capture mouse down event
    * @method Start
    * @param {event} mouse event
    * @param {shape} tool name ["circle","line","rectangular","ellipse"]
    * @param {colour} colour of the tool to be displayed
    * @return none
    */
    AnnotationTools.prototype.Start = function (event, shape, colour) {
        this.isToolActive = true;
        this.startx = event.offsetX;
        this.starty = event.offsetY;
    };
    /**
    * To capture mouse move event
    * @method Track
    * @param {event} mouse event
    * @return none
    */
    AnnotationTools.prototype.Track = function (event) {
        if (!this.isToolActive)
            return;
        this._isMouseMoved = true;
        this.context.beginPath();
        this.imageHandler.ResetAndUpdate();
        if (this.currentShape == "line") {
            this.context.moveTo(this.startx, this.starty);
            this.context.lineTo(event.offsetX, event.offsetY);
            this.context.font = '14pt Calibri';
            this.context.fillStyle = this.currentColour;
            var str = this.CalculateArea(event.offsetX, event.offsetY) + "mm";
            this.context.fillText(str, event.offsetX, event.offsetY);
        }
        if (this.currentShape == "rectangular") {
            var width = (event.offsetX - this.startx);
            var height = (event.offsetY - this.starty);
            this.context.moveTo(this.startx, this.starty);
            this.context.rect(this.startx, this.starty, width, height);
            this.context.font = '14pt Calibri';
            this.context.fillStyle = this.currentColour;
            var str = this.CalculateArea(event.offsetX, event.offsetY) + "cm2";
            this.context.fillText(str, event.offsetX, event.offsetY);

        }
        if (this.currentShape == "circle") {
            var width = (event.offsetX - this.startx);
            var height = (event.offsetY - this.starty);
            var centerX = (width) / 2 + this.startx;
            var centerY = (height) / 2 + this.starty;
            var radius = (Math.sqrt((width * width) + (height * height))) / 2;
            this.context.beginPath();
            this.context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            this.context.font = '14pt Calibri';
            this.context.fillStyle = this.currentColour;
            var str = this.CalculateArea(event.offsetX, event.offsetY, radius) + "cm2";
            this.context.fillText(str, event.offsetX + 5, event.offsetY);
        }
        if (this.currentShape == "ellipse") {
            var width = (event.offsetX - this.startx);
            var height = (event.offsetY - this.starty);
            var centerX = (width) / 2 + this.startx;
            var centerY = (height) / 2 + this.starty;
            if (width < 0)
                width = (-1) * width;
            var whalf = (width) / 2;
            if (height < 0)
                height = (-1) * height;
            var hhalf = (height) / 2;
            this.context.save();
            this.context.translate(centerX, centerY);
            if (whalf > hhalf) {
                this.context.scale(1, hhalf / whalf);
                this.context.arc(0, 0, whalf, 0, 2 * Math.PI, false);
                this.context.restore();
            }
            if (whalf < hhalf) {
                this.context.scale(1, whalf / hhalf);
                this.context.arc(0, 0, hhalf, 0, 2 * Math.PI, false);
                this.context.restore();
            }
            this.context.font = '14pt Calibri';
            this.context.fillStyle = this.currentColour;
            var str = this.CalculateArea(event.offsetX, event.offsetY, radius, whalf, hhalf) + "cm2";
            this.context.fillText(str, event.offsetX - whalf, event.offsetY + 14);
        }
        this.context.strokeStyle = this.currentColour;
        this.context.stroke();
    };
    /**
    * To capture mouse up event
    * @method Stop
    * @param {event} mouse event
    * @return none
    **/
    AnnotationTools.prototype.Stop = function (event) {
        if (!this.isToolActive)
            return;
        //to prevent unwanted drawing
        if (!this._isMouseMoved) {
            this.isToolActive = false;
            return;
        }
        this._isMouseMoved = false;
        this.isToolActive = false;
        this.context.beginPath();
        this.imageHandler.ResetAndUpdate();
        var toolParamObj = new toolParam();
        if (this.currentShape == "line") {
            this.context.moveTo(this.startx, this.starty);
            this.context.lineTo(event.offsetX, event.offsetY);
            this.context.font = '14pt Calibri';
            this.context.fillStyle = this.currentColour;
            var str = this.CalculateArea(event.offsetX, event.offsetY) + "mm";
            this.context.fillText(str, event.offsetX, event.offsetY);
            toolParamObj.AreaStr = str;
            toolParamObj.txtFont = this.context.font;
            toolParamObj.txtColor = this.context.fillStyle;
        }
        if (this.currentShape == "rectangular") {
            var width = (event.offsetX - this.startx);
            var height = (event.offsetY - this.starty);

            this.context.moveTo(this.startx, this.starty);
            this.context.rect(this.startx, this.starty, width, height);

            this.context.font = '14pt Calibri';
            this.context.fillStyle = this.currentColour;
            var str = this.CalculateArea(event.offsetX, event.offsetY) + "cm2";
            this.context.fillText(str, event.offsetX, event.offsetY);

            toolParamObj.AreaStr = str;
            toolParamObj.txtFont = this.context.font;
            toolParamObj.txtColor = this.context.fillStyle;

            toolParamObj.width = width;
            toolParamObj.height = height;
        }
        if (this.currentShape == "circle") {
            var width = (event.offsetX - this.startx);
            var height = (event.offsetY - this.starty);
            var centerX = (width) / 2 + this.startx;
            var centerY = (height) / 2 + this.starty;
            var radius = (Math.sqrt((width * width) + (height * height))) / 2;

            this.context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);

            this.context.font = '14pt Calibri';
            this.context.fillStyle = this.currentColour;
            var str = this.CalculateArea(event.offsetX, event.offsetY, radius) + "cm2";
            this.context.fillText(str, event.offsetX + 5, event.offsetY);

            toolParamObj.AreaStr = str;
            toolParamObj.txtFont = this.context.font;
            toolParamObj.txtColor = this.context.fillStyle;

            toolParamObj.width = width;
            toolParamObj.height = height;
            toolParamObj.centerX = centerX;
            toolParamObj.centerY = centerY;
            toolParamObj.radius = radius;
        }
        if (this.currentShape == "ellipse") {
            var width = (event.offsetX - this.startx);
            var height = (event.offsetY - this.starty);
            var centerX = (width) / 2 + this.startx;
            var centerY = (height) / 2 + this.starty;
            if (width < 0)
                width = (-1) * width;
            var whalf = (width) / 2;
            if (height < 0)
                height = (-1) * height;
            var hhalf = (height) / 2;
            this.context.save();
            this.context.translate(centerX, centerY);
            if (whalf > hhalf) {
                this.context.scale(1, hhalf / whalf);
                this.context.arc(0, 0, whalf, 0, 2 * Math.PI, false);
                this.context.restore();
            }
            if (whalf < hhalf) {
                this.context.scale(1, whalf / hhalf);
                this.context.arc(0, 0, hhalf, 0, 2 * Math.PI, false);
                this.context.restore();
            }
            this.context.font = '14pt Calibri';
            this.context.fillStyle = this.currentColour;
            var str = this.CalculateArea(event.offsetX, event.offsetY, radius, whalf, hhalf) + "cm2";
            this.context.fillText(str, event.offsetX - whalf, event.offsetY + 14);

            toolParamObj.AreaStr = str;
            toolParamObj.txtFont = this.context.font;
            toolParamObj.txtColor = this.context.fillStyle;

            toolParamObj.centerX = centerX;
            toolParamObj.centerY = centerY;
            toolParamObj.whalf = whalf;
            toolParamObj.hhalf = hhalf;
        }
        this.context.strokeStyle = this.currentColour;
        this.context.stroke();

        toolParamObj.startX = this.startx;
        toolParamObj.startY = this.starty,
        toolParamObj.endX = event.offsetX;
        toolParamObj.endY = event.offsetY;
        toolParamObj.colour = this.currentColour;
        toolParamObj.shape = this.currentShape;
        this.toolHistory.push(toolParamObj);
    };
    /**
    * To Calculate Area for the current tool
    * @method CalculateArea
    * @param {endx} end point x co-ordinate
    * @param {endy} end point y co-ordinate
    * @param {radius} radius of circle
    * @param {a,b} a and b radius of ellipse
    * @return {float} return area in float upto decimal points
    */
    AnnotationTools.prototype.CalculateArea = function (endx, endy, radius, a, b) {
        if (this.currentShape == "line") {
            var lx = Math.abs(endx - this.startx) * this._pixelSpacingX;
            var ly = Math.abs(endy - this.starty) * this._pixelSpacingY;
            return Math.sqrt((lx * lx) + (ly * ly)).toFixed(3);
        }
        if (this.currentShape == "rectangular") {
            var lx = Math.abs(endx - this.startx) * this._pixelSpacingX;
            var ly = Math.abs(endy - this.starty) * this._pixelSpacingY;
            return (lx * ly / 100).toFixed(3);
        }
        if (this.currentShape == "circle") {
            return (this._pixelSpacingX * this._pixelSpacingY * radius * radius * Math.PI / 100).toFixed(3);
        }
        if (this.currentShape == "ellipse") {
            return (this._pixelSpacingX * this._pixelSpacingY * a * b * Math.PI / 100).toFixed(3);
        }
    };
    /**
    * To redraw annotations in history
    * @method DrawHistory
    * @param none
    * @return none
    */
    AnnotationTools.prototype.DrawHistory = function () {
        for (var i = 0, len = this.toolHistory.length; i < len; i++) {

            if (this.toolHistory[i].shape == "line") {
                this.context.moveTo(this.toolHistory[i].startX, this.toolHistory[i].startY);
                this.context.lineTo(this.toolHistory[i].endX, this.toolHistory[i].endY);
                this.context.font = this.toolHistory[i].txtFont;
                this.context.fillStyle = this.toolHistory[i].txtColor;
                this.context.fillText(this.toolHistory[i].AreaStr, this.toolHistory[i].endX, this.toolHistory[i].endY);
            }
            if (this.toolHistory[i].shape == "rectangular") {
                this.context.moveTo(this.toolHistory[i].startX, this.toolHistory[i].startY);
                this.context.rect(this.toolHistory[i].startX, this.toolHistory[i].startY, this.toolHistory[i].endX - this.toolHistory[i].startX, this.toolHistory[i].endY - this.toolHistory[i].startY);
                this.context.font = this.toolHistory[i].txtFont;
                this.context.fillStyle = this.toolHistory[i].txtColor;
                this.context.fillText(this.toolHistory[i].AreaStr, this.toolHistory[i].endX, this.toolHistory[i].endY);
            }
            if (this.toolHistory[i].shape == "circle") {
                this.context.arc(this.toolHistory[i].centerX, this.toolHistory[i].centerY, this.toolHistory[i].radius, 0, 2 * Math.PI, false);
                this.context.font = this.toolHistory[i].txtFont;
                this.context.fillStyle = this.toolHistory[i].txtColor;
                this.context.fillText(this.toolHistory[i].AreaStr, this.toolHistory[i].endX, this.toolHistory[i].endY);
            }
            if (this.toolHistory[i].shape == "ellipse") {
                this.context.save();
                this.context.translate(this.toolHistory[i].centerX, this.toolHistory[i].centerY);
                if (this.toolHistory[i].whalf > this.toolHistory[i].hhalf) {
                    this.context.scale(1, this.toolHistory[i].hhalf / this.toolHistory[i].whalf);
                    this.context.arc(0, 0, this.toolHistory[i].whalf, 0, 2 * Math.PI, false);
                    this.context.restore();
                }
                if (this.toolHistory[i].whalf < this.toolHistory[i].hhalf) {
                    this.context.scale(1, this.toolHistory[i].whalf / this.toolHistory[i].hhalf);
                    this.context.arc(0, 0, this.toolHistory[i].hhalf, 0, 2 * Math.PI, false);
                    this.context.restore();
                }
                this.context.font = this.toolHistory[i].txtFont;
                this.context.fillStyle = this.toolHistory[i].txtColor;
                this.context.fillText(this.toolHistory[i].AreaStr, this.toolHistory[i].endX - this.toolHistory[i].whalf, this.toolHistory[i].endY + 14);
            }
            this.context.strokeStyle = this.toolHistory[i].colour;
            this.context.stroke();
            this.context.beginPath();
        }
    };
    /**
    * Class to store the current tool requred infomation for drawing
    * @class toolParam
    * @param none
    * @return none
    */
    var toolParam = function () {
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;
        this.width = 0;
        this.height = 0;
        this.centerX = 0;
        this.centerY = 0;
        this.radius = 0;
        this.whalf = 0;
        this.hhalf = 0;
        this.colour = "black"
        this.shape = "line";
        this.AreaStr = "";
        this.txtFont = "";
        this.txtColor = "";
    };

    return AnnotationTools;
})();

/*********************
Summary:To perform LUT operations
* @class WindowLevelTool
* @namespace
* @constructor
* @param
**********************/
var WindowLevelTool = (function () {
    function WindowLevelTool() {
        this.startX;
        this.startY;
        this.viewer;
        this.isActive = false;
        this.imageHandler = null;
        this.canvas;
        this.context;
        this.maptoolName;
    }
    /**
    * To Set ImageHandler's object into current stream
    * @method SetImageHandler
    * @param {imagehandler} ImageHandler object
    * @return none
    */
    WindowLevelTool.prototype.SetImageHandler = function (handler) {
        if (handler) {
            this.imageHandler = handler;
            this.viewer = this.imageHandler.viewer;
            this.context = this.imageHandler.context;
            this.canvas = this.imageHandler.canvas;
            this.maptoolName = this.imageHandler.currentTool;
        }

    };
    /**
    * To capture mouse down event
    * @method Start
    * @param {event} mouse event
    * @return none
    */
    WindowLevelTool.prototype.Start = function (event) {
        this.startX = event.offsetX;
        this.startY = event.offsetY;
        this.isActive = true;
    };
    /**
    * To capture mouse move event
    * @method Track
    * @param {event} mouse event
    * @return none
    */
    WindowLevelTool.prototype.Track = function (event) {
        if (!this.isActive)
            return
        // difference to last position
        var diffX = event.offsetX - this.startX;
        var diffY = event.offsetY - this.startY;
        // calculate new window level
        var windowCenter = parseInt(this.viewer.getWindowLut().getCenter(), 10) + diffY;
        var windowWidth = parseInt(this.viewer.getWindowLut().getWidth(), 10) + diffX;
        // update GUI
       // console.log(windowCenter + "" + windowWidth);
		if(windowWidth < 1)
			windowWidth = 1;
        this.viewer.setWindowLevel(windowCenter, windowWidth);
        var imageData = this.context.createImageData(this.canvas.width, this.canvas.height);
        this.viewer.generateImageData(imageData);
        this.context.putImageData(imageData, 0, 0);
        // store position
        this.startX = event.offsetX;
        this.startY = event.offsetY;
        this.imageHandler.SetCanvasImage(imageData);
        this.imageHandler.Update();
    };
    /**
    * To capture mouse up event
    * @method Stop
    * @param {event} mouse event
    * @return none
    **/
    WindowLevelTool.prototype.Stop = function (event) {
        this.startX = event.offsetX;
        this.startY = event.offsetY;
        this.isActive = false;
    };
    //     /**
    //     * To Clear wl operation
    //     * @method Clear
    //     * @param {event} mouse event
    //     * @return none
    //     **/
    //    WindowLevelTool.prototype.Clear = function(event)
    //    {
    //        this.startX = event.offsetX;
    //        this.startY = event.offsetY;
    //        this.isActive = false;
    //    };

    /**
    * To Apply colout filters invert hot rainbow hot based on maptoolName value
    * @method ChangeColorMap
    * @return none
    **/
    WindowLevelTool.prototype.ChangeColorMap = function () {
        this.isActive = false;
        var windowCenter = this.viewer.getWindowLut().getCenter();
        var windowWidth = this.viewer.getWindowLut().getWidth();
        // fill in the image data
        var colourMaplist = {
            "plain": dwv.image.lut.plain,
            "invplain": dwv.image.lut.invPlain,
            "rainbow": dwv.image.lut.rainbow,
            "hot": dwv.image.lut.hot,
            "test": dwv.image.lut.test
        }
        var colourMap = colourMaplist[this.maptoolName];
        this.viewer.setColorMap(colourMap);
        var imageData = this.context.createImageData(this.canvas.width, this.canvas.height);
        this.viewer.generateImageData(imageData);
        this.context.putImageData(imageData, 0, 0);
        this.imageHandler.SetCanvasImage(imageData);
        this.imageHandler.Update();
    };

    return WindowLevelTool;
})();

//TODO : find a better logic
var TransformationTool = (function () {
    function TransformationTool() {
        this._orgX = 0;
        this._orgY = 0;
        this._zoomX = 1;
        this._zoomY = 1;
        this.canvas;
        this.context;
        this.imageData;
        this.cacheCanvas;
        this._scale = 1;
        this.imageHandler = null;
    }
    TransformationTool.prototype.SetImageHandler = function (handler) {
        if (handler) {
            this.imageHandler = handler;
            this.viewer = this.imageHandler.viewer;
            this.context = this.imageHandler.context;
            this.canvas = this.imageHandler.canvas;
            this.cacheCanvas = this.imageHandler.cacheCanvas;
            this.imageData = this.imageHandler.canvasImage;
            //        this._orgX =this.imageHandler.orgX;
            //        this._orgY =this.imageHandler.orgY;
            //        this._zoomX =this.imageHandler.zoomX;
            //        this._zoomY = this.imageHandler.zoomY;
        }

    };
    TransformationTool.prototype.Start = function (event) {
        this.canvas = event.target;
        //      this.cacheCanvas = document.createElement("canvas");
        //      this.cacheCanvas.width = this.canvas.width;
        //      this.cacheCanvas.height = this.canvas.height;
        this.cacheCanvas.getContext("2d").putImageData(this.imageData, 0, 0);
        var scale = 0.1;
        if (event.wheelDelta > 0) {
            //scale = 2;
            this._scale += 1;
            this.ZoomIN(this._scale, event.offsetX, event.offsetY);
        }
        else {
            // scale =.5;
            this.ZoomOUT();
        }
        //this.imageData = imagedata;

        // this.ZoomIN(scale,event.offsetX,event.offsetY);
    };
    TransformationTool.prototype.ZoomIN = function (scale, centerx, centery) {
        var scaleX = scale;
        var scaleY = scale;
        var imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        var data = this.imageData.data;
        var target = this.context.createImageData(this.canvas.width * scaleX, this.canvas.height * scaleY);
        this.canvas.width = this.canvas.width;
        var imageWidth = this.canvas.width;
        var imageHeight = this.canvas.height;
        var tdata = target.data;
        var fortdata = []
        for (var y = 0, y1 = 0; y < imageHeight; y++, y1 += scaleY) {
            var column = [];
            var row = [];
            for (var x = 0; x < imageWidth; x++) {
                for (var i = 0; i < scaleX; i++) {
                    column.push(data[((imageWidth * y) + x) * 4]);
                    column.push(data[((imageWidth * y) + x) * 4 + 1]);
                    column.push(data[((imageWidth * y) + x) * 4 + 2]);
                    column.push(data[((imageWidth * y) + x) * 4 + 3]);
                }
            }
            for (var j = 0; j < scaleY; j++) {
                for (var k = 0; k < column.length; k++)
                    row.push(column[k])
            }
            for (var l = 0; l < row.length; l++)
                fortdata.push(row[l]);
        }
        for (var l = 0, len = fortdata.length; l < len; l++)
            tdata[l] = fortdata[l];
        //	  this.context.putImageData(target,0,0);
        var c = (this.canvas.width / 2) - centerx;
        var d = (this.canvas.height / 2) - centery;
        this.context.putImageData(target, c, d);
    };

    TransformationTool.prototype.ZoomOUT = function () {

    };
    return TransformationTool;
})();

/*********************
Summary: To Apply filters like Sobel Sharpener threshold
* @class FilterTool
* @namespace
* @constructor
* @param
**********************/
var FilterTool = (function () {
    function FilterTool() {
        this.viewer = null;
        this.context = null;
        this.canvas = null;
        this.imageHandler = null;
    }
    /**
    * To Set ImageHandler's object into current stream
    * @method SetImageHandler
    * @param {handler} ImageHandler object
    * @return none
    */
    FilterTool.prototype.SetImageHandler = function (handler) {
        if (handler) {
            this.imageHandler = handler;
            this.viewer = this.imageHandler.viewer;
            this.context = this.imageHandler.context;
            this.canvas = this.imageHandler.canvas;
        }
    };
    /**
    * To perform Sobel Edge Detection
    * @method Sobel
    * @return none
    */
    FilterTool.prototype.Sobel = function () {
        if (!this.viewer)
            return false;
        var gradX = this.viewer.getImage().convolute2D(
          [1, 0, -1,
            2, 0, -2,
            1, 0, -1]);

        var gradY = this.viewer.getImage().convolute2D(
          [1, 2, 1,
             0, 0, 0,
            -1, -2, -1]);

        var image = gradX.compose(gradY, function (x, y) { return Math.sqrt(x * x + y * y); });
        var imageData = this.context.createImageData(this.canvas.width, this.canvas.height);
        this.viewer.setImage(image);
        this.viewer.generateImageData(imageData);
        this.context.putImageData(imageData, 0, 0);
        this.imageHandler.SetCanvasImage(imageData);
        this.imageHandler.Update();
    };

    /**
    * To perform Sharpen the displayed image
    * @method Sharpen
    * @return none
    */
    FilterTool.prototype.Sharpen = function () {
        if (!this.viewer)
            return false;
        var image = this.viewer.getImage().convolute2D(
        [0, -1, 0,
          -1, 5, -1,
           0, -1, 0]);
        var imageData = this.context.createImageData(this.canvas.width, this.canvas.height);
        this.viewer.setImage(image);
        this.viewer.generateImageData(imageData);
        this.context.putImageData(imageData, 0, 0);
        this.imageHandler.SetCanvasImage(imageData);
        this.imageHandler.Update();
    };
    /**
    * To perform Threshold level filtering
    * @method Threshold
    * @return none
    */
    FilterTool.prototype.Threshold = function () {
        // TODO : need to a proper scaler to get threshold values
       if (!this.viewer)
          return false;
       var imageMin= this.viewer.getImage().getDataRange().min;
       var min = this.imageHandler.thresholdRange.min;
       var max = this.imageHandler.thresholdRange.max;
       var threshFunction = function(value){
          if(value<min||value>max) {
              return imageMin;
          }
          else {
              return value;
          }
        };
      var image =  this.viewer.getImage().transform( threshFunction );
      var imageData = this.context.createImageData(this.canvas.width, this.canvas.height);
      this.viewer.setImage(image);
      this.viewer.generateImageData(imageData);
      this.context.putImageData(imageData, 0, 0);
      this.imageHandler.SetCanvasImage(imageData);
      this.imageHandler.Update();
    };
    return FilterTool;
})();

/*********************
Summary: To handle and store all the operation related to image
* @class ImageHandler
* @namespace
* @constructor
* @param
**********************/
var ImageHandler = (function () {
    function ImageHandler() {
        this.viewer = null;
        this.image = null;
        this.tag = null;
        this.canvasImage = null;
        this.canvas = null;
        this.context = null;
        this.originalImage = null;
        this.toolHandler = ToolHandler.GetInstence();
        this.history = [];
        this.currentTool;
        this.currentColour;
        this.annotationHistory = [];
        this.orgX = 0;
        this.orgY = 0;
        this.zoomX = 1;
        this.zoomY = 1;
        this.cacheCanvas = null;
        this.thresholdRange={min:0,max:100}
        this._annotationTool = null;
        this._transformationTool = null;
    }
    /**
    * To Set DWV viewer Object
    * @method SetViewer
    * @return none
    */
    ImageHandler.prototype.SetViewer = function (viewer) {
        if (viewer) {
            this.viewer = viewer;
            this.image = this.viewer.getImage();
        }
    };
    /**
    * To Set DWV tag Object
    * @method SetTag
    * @return none
    */
    ImageHandler.prototype.SetTag = function (tag) {
        if (tag) {
            this.tag = tag;
        }
    };
    /**
    * To get DWV viewer Object
    * @method GetViewer
    * @return viewer Object
    */
    ImageHandler.prototype.GetViewer = function () {
        return this.viewer;
    };
    /**
    * To get DWV image Object
    * @method Getimage
    * @return image Objec
    */
    ImageHandler.prototype.Getimage = function () {
        return this.image;
    };
    /**
    * To Set displaying canvas for the image
    * @method SetCanvas
    * @return none
    */
    ImageHandler.prototype.SetCanvas = function (canvas) {
        if (canvas) {
            this.canvas = canvas;
            this.context = this.canvas.getContext("2d");
            this.toolHandler.SetImageHandler(this);
        }
    };
    /**
    * To returns current canvas of the image
    * @method GetCanvas
    * @return html canvas object
    */
    ImageHandler.prototype.GetCanvas = function () {
        return this.canvas;
    };
    /**
    * To Set displaying image for the canvas
    * @method SetCanvasImage
    * @return none
    */
    ImageHandler.prototype.SetCanvasImage = function (canimg) {
        this.canvasImage = canimg;
    };
    /**
    * To Get displayed image from the canvas
    * @method GetCanvasImage
    * @return image(byte array)
    */
    ImageHandler.prototype.GetCanvasImage = function () {
        return this.canvasImage;
    };
    /**
    * To Get Context of canvas
    * @method GetContext
    * @return html 2d context obj of canvas
    */
    ImageHandler.prototype.GetContext = function () {
        return this.context;
    };
    /**
    * To Set current tools name and parameter e.g.('line','red')
    * @method SetToolParam
    * @param {currenttool} toolname
    * @param {colour} color or filter name
    * @return none
    **/
    ImageHandler.prototype.SetToolParam = function (currenttool, colour) {
        this.currentTool = currenttool;
        this.currentColour = colour;
    };
    /**
    * Returns the annotation tool object with current image handler assigned on it
    * @method GetAnnotationTool
    * @return annotation tool object
    */
    ImageHandler.prototype.GetAnnotationTool = function () {
        // this._annotationTool = this.toolHandler.GetAnnotationTool();
        // return  this._annotationTool;
        this.toolHandler.SetImageHandler(this);
        return this.toolHandler.GetAnnotationTool();
    };
    /**
    * Returns the WindowLevel tool object with current image handler assigned on it
    * @method GetWindowLevelTool
    * @return WindowLevel tool object
    */
    ImageHandler.prototype.GetWindowLevelTool = function () {
        this.toolHandler.SetImageHandler(this);
        return this.toolHandler.GetWindowLevelTool();
    };
    /**
    * Returns the Filter tool object with current image handler assigned on it
    * @method GetFilterTool
    * @return Filter tool object
    */
    ImageHandler.prototype.GetFilterTool = function () {
        this.toolHandler.SetImageHandler(this);
        return this.toolHandler.GetFilterTool();
    };
    /**
    * Returns the Transformation tool object with current image handler assigned on it
    * @method GetTransformationTool
    * @return Transformation tool object
    */
    ImageHandler.prototype.GetTransformationTool = function () {
        // this._transformationTool = this.toolHandler.GetTransformationTool();
        //return this._transformationTool;
        this.toolHandler.SetImageHandler(this);
        return this.toolHandler.GetTransformationTool();
    };
    /**
    * To displayed dicom image in canvas
    * @method DrawImage
    * @return none
    */
    ImageHandler.prototype.DrawImage = function () {
        this.canvasImage = this.context.createImageData(this.canvas.width, this.canvas.height);
        this.viewer.generateImageData(this.canvasImage);
        this.context.putImageData(this.canvasImage, 0, 0);
        if (!this.originalImageData) {
            this.originalImageData = this.context.createImageData(this.canvas.width, this.canvas.height);
            this.viewer.generateImageData(this.originalImageData);
        }
        this.cacheCanvas = document.createElement("canvas");
        this.cacheCanvas.width = this.canvas.width;
        this.cacheCanvas.height = this.canvas.height;
    };
    /**
    * To reset image in canvas
    * @method ResetImage
    * @return none
    */
    ImageHandler.prototype.ResetImage = function () {
        this.canvas.width = this.canvas.width
        this.context.putImageData(this.canvasImage, 0, 0);
    };
    /**
    * To clear image in canvas
    * @method Clear
    * @return none
    */
    ImageHandler.prototype.Clear = function () {
        this.canvas.width = this.canvas.width;
    };
    /**
    * To reset canvas
    * @method ResetAll
    * @return none
    */
    ImageHandler.prototype.ResetAll = function () {
        this.canvas.width = this.canvas.width
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.putImageData(this.originalImageData, 0, 0);
        this.annotationHistory.length=0;
        this.canvasImage = this.context.getImageData(0,0,this.canvas.width, this.canvas.height);
    };
    /**
    * To reset transformation applied to canvas
    * @method ResetTrasnformation
    * @return none
    */
    ImageHandler.prototype.ResetTrasnformation = function () {
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.putImageData(this.canvasImage, 0, 0);
    };
    /**
    * To apply current transformation  to canvas
    * @method ApplyCurrentTransformation
    * @return none
    */
    //TODO : need better logic
    ImageHandler.prototype.ApplyCurrentTransformation = function () {
        this.cacheCanvas.getContext("2d").putImageData(this.canvasImage, 0, 0);
        this.context.save();
        // use the identity matrix while clearing the canvas
        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // restore the transform
        this.context.restore();

        // draw the cached canvas on the context
        // transform takes as input a, b, c, d, e, f to create
        // the transform matrix (column-major order):
        // [ a c e ]
        // [ b d f ]
        // [ 0 0 1 ]
        this.context.setTransform(this.zoomX, 0, 0, this.zoomY, this.orgX, this.orgY);
        this.context.drawImage(this.cacheCanvas, 0, 0);
    };
    /**
    * To clear annotation in the image
    * @method ClearAnnotation
    * @return none
    */
    ImageHandler.prototype.ClearAnnotation = function () {
        this.annotationHistory.length = 0;
        this.ResetImage();
    };
    /**
    * To clear lut applied in the image
    * @method ClearLut
    * @return none
    */
    ImageHandler.prototype.ClearLut = function () {
        this.ResetImage();
    };
    /**
    * To update image with its history
    * @method Update
    * @return none
    */
    ImageHandler.prototype.Update = function () {
        //this.ApplyCurrentTransformation();
        this.GetAnnotationTool().DrawHistory();

    };
    /**
    * To reset and update image with its history
    * @method ResetAndUpdate
    * @return none
    */
    ImageHandler.prototype.ResetAndUpdate = function () {
        //this.ApplyCurrentTransformation();
        this.ResetImage();
        this.GetAnnotationTool().DrawHistory();

    };
    /**
    * To update image with its previous annotations
    * @method UpdateAnnotation
    * @return none
    */
    ImageHandler.prototype.UpdateAnnotation = function () {
        this.GetAnnotationTool().DrawHistory();

    };
    /**
    * To retuns tag object with removes of SQ data and in a formate of {Name:'',Value'',TagStr:'(group,element)'}
    * @method GetFilteredTags
    * @return displayable Tag object for demographic info
    */
    ImageHandler.prototype.GetFilteredTags = function () {
        var tagColl = this.tag;
        var key = Object.keys(tagColl);
        var filteredTags = [];
        for (var i = 0, len = key.length; i < len; i++) {
            if (key[i] != "PixelData" && !key[i].match(/Sequence/gi) && !key[i].match(/item/gi) && !key[i].match(/unknown/gi)) {
                var val = tagColl[key[i]];
                var tagobj = {};
                tagobj.Name = key[i];
                tagobj.Value = val.value.toString().trim().replace(/(\r\n|\n|\r)/gm, "");
                tagobj.TagStr = '(' + val.group + ',' + val.element + ')';
                filteredTags.push(tagobj);
            }
        }
        return filteredTags;
    };
    //Note:kept for feature
    ImageHandler.prototype.DisposeTool = function () {
    };
    ImageHandler.prototype.GetHistory = function () {
    };
    ImageHandler.prototype.UpdateHistory = function () {
    };
    ImageHandler.prototype.DisopseAll = function () {
    };
    return ImageHandler;
})();

/*********************
Summary: to handle all the tool operation related to image handler
* @class ToolHandler
* @namespace
* @constructor
* @param
**********************/
var ToolHandler = (function () {
    function ToolHandler() {
        this.imagehandler = null;
        this.annotationTool = new AnnotationTools();
        this.windowLevelTool = new WindowLevelTool();
        this.filterTool = new FilterTool();
        this.transformationTool = new TransformationTool();
    }
    /**
    * To Set ImageHandler's object into current stream
    * @method SetImageHandler
    * @param {imagehandler} ImageHandler object
    * @return none
    */
    ToolHandler.prototype.SetImageHandler = function (imagehandler) {
        if (imagehandler)
            this.imagehandler = imagehandler;
    };
    /**
    * Returns the annotation tool object with current image handler assigned on it
    * @method GetAnnotationTool
    * @return annotation tool object
    */
    ToolHandler.prototype.GetAnnotationTool = function () {
        this.annotationTool.SetImageHandler(this.imagehandler);
        return this.annotationTool;
    };
    /**
    * Returns the WindowLevel tool object with current image handler assigned on it
    * @method GetWindowLevelTool
    * @return WindowLevel tool object
    */
    ToolHandler.prototype.GetWindowLevelTool = function () {
        this.windowLevelTool.SetImageHandler(this.imagehandler);
        return this.windowLevelTool;
    };
    /**
    * Returns the Filter tool object with current image handler assigned on it
    * @method GetFilterTool
    * @return Filter tool object
    */
    ToolHandler.prototype.GetFilterTool = function () {
        this.filterTool.SetImageHandler(this.imagehandler);
        return this.filterTool;
    };
    /**
    * Returns the Transformation tool object with current image handler assigned on it
    * @method GetTransformationTool
    * @return Transformation tool object
    */
    ToolHandler.prototype.GetTransformationTool = function () {
        this.transformationTool.SetImageHandler(this.imagehandler);
        return this.transformationTool;
    };
    var instence = null
    /**
    * Returns single instence of ToolHandler
    * @method GetInstence
    * @return ToolHandler object
    */
    ToolHandler.GetInstence = function () {
        if (!instence)
            instence = new ToolHandler();
        return instence;
    }
    return ToolHandler;
})();

/*********************
Summary: To handle File Api of html and maintain collection of all files and related onjects to it
* @class FileHandler
* @namespace
* @constructor
* @param
**********************/
var FileHandler = (function () {
    function FileHandler() {
        this.fileList = [];
        this.canvas = null;
        this.context = null;
        this.parentElement = null;
        this.callBack = null;
        this.index = 0;
        this.remoteFile = false
    }
    /**
    * To Set elements need to process
    * @method SetElements
    * @param {canvas} canvas on which image will be drawn
    * @param {parentElement} parent element of canvas
    * @param {callback} callback funcation to be called after a file is been loaded
    * @return none
    */
    FileHandler.prototype.SetElements = function (canvas, parentElement, callback) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
        this.parentElement = parentElement;
        this.callBack = callback;
    };
    /**
    * To initialize the objects as per the number of file selected
    * @method InitializeFiles
    * @param {fileApiObjArray} file object array from file change evet
    * @return none
    */
    FileHandler.prototype.InitializeFiles = function (fileApiObjArray) {
        this.index = 0;
        this.fileList.length = 0;
        this.remoteFile = false;
        for (var i = 0, length = fileApiObjArray.length; i < length; i++) {
            var file = new fileParam();
            file.FileObj = fileApiObjArray[i];
            file.ImageHandler = new ImageHandler();
            this.fileList.push(file);
        }
    };
    /**
    * To initialize the objects as per the number of file selected
    * @method InitializeRemotetFiles
    * @param {urlarray} file object array from file change evet
    * @return none
    */
    FileHandler.prototype.InitializeRemoteFiles = function (urlarray) {
        this.index = 0;
        this.fileList.length = 0;
        this.remoteFile = true;
        for (var i = 0, length = urlarray.length; i < length; i++) {
            var urlObj = new urlParam();
            urlObj.Url = urlarray[i];
            urlObj.ImageHandler = new ImageHandler();
            this.fileList.push(urlObj);
        }
    };
    /**
    * To load current file in canvas
    * @method LoadFile
    * @param {fileListObj} required file object to be loaded
    * @return none
    */
    FileHandler.prototype.LoadFile = function (fileListObj) {
        var reader = new FileReader();
        var canvas = this.canvas;
        var parentElement = this.parentElement
        var callback = this.callBack;
        //event call back of  FileReader Api
        reader.onloadend = function (evt) {
            try {
                if (evt.target.readyState == FileReader.DONE) { // DONE == 2
                    byteArray = evt.target.result;
                    // DICOM parser
                    var dicomParser = new dwv.dicom.DicomParser();
                    // parse the buffer
                    dicomParser.parse(byteArray);
                    //image.view object
                    view = dicomParser.createImage();
                    tags = dicomParser.dicomElements;
                    var img = view.getImage();
                    var size = img.getSize();
                    canvas.width = size.getNumberOfColumns();
                    canvas.height = size.getNumberOfRows();

                    parentElement.style.width = (canvas.width) + 'px';
                    parentElement.style.height = (canvas.height) + 'px';

                    fileListObj.ImageHandler.SetViewer(view);
                    fileListObj.ImageHandler.SetTag(tags);
                    fileListObj.ImageHandler.SetCanvas(canvas);
                    fileListObj.ImageHandler.DrawImage();
                    if (callback)
                        callback();

                }
            }
            catch (ex) {
                alert(ex.message);
            }
        };
        reader.readAsArrayBuffer(fileListObj.FileObj);
    };

    /**
    * To load current file in canvas
    * @method LoadRemoteFile
    * @param {fileListObj} required file object to be loaded
    * @return none
    */
    FileHandler.prototype.LoadRemoteFile = function (fileListObj) {
        var reader = new FileReader();
        var canvas = this.canvas;
        var parentElement = this.parentElement
        var callback = this.callBack;

        var request = new XMLHttpRequest();
        var url = fileListObj.Url;
        request.open('GET', url, true);
        request.responseType = "arraybuffer";
        request.onload = function (/*event*/) {
            //         var data = dwv.image.getDataFromDicomBuffer(request.response);
            var dicomParser = new dwv.dicom.DicomParser();
            // parse the buffer
            dicomParser.parse(request.response);
            //image.view object
            view = dicomParser.createImage();
            tags = dicomParser.dicomElements;
            var img = view.getImage();
            var size = img.getSize();
            canvas.width = size.getNumberOfColumns();
            canvas.height = size.getNumberOfRows();

            parentElement.style.width = (canvas.width) + 'px';
            parentElement.style.height = (canvas.height) + 'px';

            fileListObj.ImageHandler.SetViewer(view);
            fileListObj.ImageHandler.SetTag(tags);
            fileListObj.ImageHandler.SetCanvas(canvas);
            fileListObj.ImageHandler.DrawImage();
            if (callback)
                callback();
        };
        request.send(null);
    };
    /**
    * To Reset Displayed file
    * @method ResetCurrentImage
    * @param {index} index of required file needed to be reseted
    * @return none
    */
    FileHandler.prototype.ResetCurrentImage = function (index) {
        this.index = index;
        if (!this.remoteFile)
           this.LoadFile(this.fileList[this.index]);
        else
           this.LoadRemoteFile(this.fileList[this.index]);

    };
    /**
    * To Display the file from given index
    * @method SetDisplayFile
    * @param {index} index of required file needed to be loaded
    * @return none
    */
    FileHandler.prototype.SetDisplayFile = function (index) {
        this.index = index;
        var imghandler = this.fileList[this.index].ImageHandler;
        if (!imghandler.GetCanvasImage()) {
            if (!this.remoteFile)
                this.LoadFile(this.fileList[this.index]);
            else
                this.LoadRemoteFile(this.fileList[this.index]);
        }
        else {
            var img = imghandler.Getimage();
            var size = img.getSize();
            this.canvas.width = size.getNumberOfColumns();
            this.canvas.height = size.getNumberOfRows();
            this.canvas.height = size.getNumberOfRows();
            this.parentElement.style.width = (this.canvas.width) + 'px';
            this.parentElement.style.height = (this.canvas.height) + 'px';
            imghandler.ResetAndUpdate();
        }
    };
    /**
    * Returns current loaded file's index
    * @method GetCurrentIndex
    * @return index(number)
    */
    FileHandler.prototype.GetCurrentIndex = function (index) {
        return this.index;
    };
    /**
    * Returns current loaded file's imagehandler object
    * @method GetCurrentImageHandler
    * @param {index} index of required file's handler needed
    * @return imagehandler object
    */
    FileHandler.prototype.GetCurrentImageHandler = function (index) {
        return this.fileList[this.index].ImageHandler;
    };
    /**
    * Class to store the files objects required
    * @class fileParam
    * @param none
    * @return none
    */
    var fileParam = function () {
        this.FileObj = null;
        this.ImageHandler = null;
    };
    /**
    * Class to store the remort files objects required
    * @class urlParam
    * @param none
    * @return none
    */
    var urlParam = function () {
        this.Url = null;
        this.ImageHandler = null;
        this.DataArray = null;
    };
    var instence = null
    /**
    * Returns single instence of FileHandler
    * @method GetInstence
    * @return FileHandler object
    */
    FileHandler.GetInstence = function () {
        if (!instence)
            instence = new FileHandler();
        return instence;
    }
    return FileHandler;
})();
