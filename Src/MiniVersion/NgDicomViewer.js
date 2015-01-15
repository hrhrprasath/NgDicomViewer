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
            pxlValue = tag.ImagerPixelSpacing.value;
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

/** 
 * DICOM module.
 * @module dicom
 */
var dwv = dwv || {};
dwv.dicom = dwv.dicom || {};

/**
 * Data reader.
 * @class DataReader
 * @namespace dwv.dicom
 * @constructor
 * @param {Array} buffer The input array buffer.
 * @param {Boolean} isLittleEndian Flag to tell if the data is little or big endian.
 */
dwv.dicom.DataReader = function(buffer, isLittleEndian)
{
    /**
     * The main data view.
     * @property view
     * @private
     * @type DataView
     */
    var view = new DataView(buffer);
    // Set endian flag if not defined.
    if(typeof(isLittleEndian)==='undefined') {
        isLittleEndian = true;
    }
    
    /**
     * Read Uint8 (1 byte) data.
     * @method readUint8
     * @param {Number} byteOffset The offset to start reading from.
     * @return {Number} The read data.
     */
    this.readUint8 = function(byteOffset) {
        return view.getUint8(byteOffset, isLittleEndian);
    };
    /**
     * Read Uint16 (2 bytes) data.
     * @method readUint16
     * @param {Number} byteOffset The offset to start reading from.
     * @return {Number} The read data.
     */
    this.readUint16 = function(byteOffset) {
        return view.getUint16(byteOffset, isLittleEndian);
    };
    /**
     * Read Uint32 (4 bytes) data.
     * @method readUint32
     * @param {Number} byteOffset The offset to start reading from.
     * @return {Number} The read data.
     */
    this.readUint32 = function(byteOffset) {
        return view.getUint32(byteOffset, isLittleEndian);
    };
    /**
     * Read Float32 (8 bytes) data.
     * @method readFloat32
     * @param {Number} byteOffset The offset to start reading from.
     * @return {Number} The read data.
     */
    this.readFloat32 = function(byteOffset) {
        return view.getFloat32(byteOffset, isLittleEndian);
    };
    /**
     * Read Uint data of nBytes size.
     * @method readNumber
     * @param {Number} byteOffset The offset to start reading from.
     * @param {Number} nBytes The number of bytes to read.
     * @return {Number} The read data.
     */
    this.readNumber = function(byteOffset, nBytes) {
        if( nBytes === 1 ) {
            return this.readUint8(byteOffset, isLittleEndian);
        }
        else if( nBytes === 2 ) {
            return this.readUint16(byteOffset, isLittleEndian);
        }
        else if( nBytes === 4 ) {
            return this.readUint32(byteOffset, isLittleEndian);
        }
        else if( nBytes === 8 ) {
            return this.readFloat32(byteOffset, isLittleEndian);
        }
        else { 
            console.log("Non number: '"+this.readString(byteOffset, nBytes)+"'");
            throw new Error("Unsupported number size.");
        }
    };
    /**
     * Read Uint8 array.
     * @method readUint8Array
     * @param {Number} byteOffset The offset to start reading from.
     * @param {Number} size The size of the array.
     * @return {Array} The read data.
     */
    this.readUint8Array = function(byteOffset, size) {
        var data = new Uint8Array(size);
        var index = 0;
        for(var i=byteOffset; i<byteOffset + size; ++i) {     
            data[index++] = this.readUint8(i);
        }
        return data;
    };
    /**
     * Read Uint16 array.
     * @method readUint16Array
     * @param {Number} byteOffset The offset to start reading from.
     * @param {Number} size The size of the array.
     * @return {Array} The read data.
     */
    this.readUint16Array = function(byteOffset, size) {
        var data = new Uint16Array(size/2);
        var index = 0;
        for(var i=byteOffset; i<byteOffset + size; i+=2) {     
            data[index++] = this.readUint16(i);
        }
        return data;
    };
    /**
     * Read data as an hexadecimal string.
     * @method readHex
     * @param {Number} byteOffset The offset to start reading from.
     * @return {Array} The read data.
     */
    this.readHex = function(byteOffset) {
        // read and convert to hex string
        var str = this.readUint16(byteOffset).toString(16);
        // return padded
        return "0x0000".substr(0, 6 - str.length) + str.toUpperCase();
    };
    /**
     * Read data as a string.
     * @method readString
     * @param {Number} byteOffset The offset to start reading from.
     * @param {Number} nChars The number of characters to read.
     * @return {String} The read data.
     */
    this.readString = function(byteOffset, nChars) {
        var result = "";
        for(var i=byteOffset; i<byteOffset + nChars; ++i){
            result += String.fromCharCode( this.readUint8(i) );
        }
        return result;
    };
};

/**
 * Tell if a given syntax is a JPEG one.
 * @method isJpegTransferSyntax
 * @param {String} The transfer syntax to test.
 * @returns {Boolean} True if a jpeg syntax.
 */
dwv.dicom.isJpegTransferSyntax = function(syntax)
{
    return syntax.match(/1.2.840.10008.1.2.4.5/) !== null ||
        syntax.match(/1.2.840.10008.1.2.4.6/) !== null||
        syntax.match(/1.2.840.10008.1.2.4.7/) !== null;
};

/**
 * Tell if a given syntax is a JPEG-LS one.
 * @method isJpeglsTransferSyntax
 * @param {String} The transfer syntax to test.
 * @returns {Boolean} True if a jpeg-ls syntax.
 */
dwv.dicom.isJpeglsTransferSyntax = function(syntax)
{
    return syntax.match(/1.2.840.10008.1.2.4.8/) !== null;
};

/**
 * Tell if a given syntax is a JPEG 2000 one.
 * @method isJpeg2000TransferSyntax
 * @param {String} The transfer syntax to test.
 * @returns {Boolean} True if a jpeg 2000 syntax.
 */
dwv.dicom.isJpeg2000TransferSyntax = function(syntax)
{
    return syntax.match(/1.2.840.10008.1.2.4.9/) !== null;
};

/**
 * DicomParser class.
 * @class DicomParser
 * @namespace dwv.dicom
 * @constructor
 */
dwv.dicom.DicomParser = function()
{
    /**
     * The list of DICOM elements.
     * @property dicomElements
     * @type Array
     */
    this.dicomElements = {};
    /**
     * The number of DICOM Items.
     * @property numberOfItems
     * @type Number
     */
    this.numberOfItems = 0;
    /**
     * The pixel buffer.
     * @property pixelBuffer
     * @type Array
     */
    this.pixelBuffer = [];
};

/**
 * Get the DICOM data pixel buffer.
 * @method getPixelBuffer
 * @returns {Array} The pixel buffer.
 */
dwv.dicom.DicomParser.prototype.getPixelBuffer = function()
{
    return this.pixelBuffer;
};

/**
 * Append a DICOM element to the dicomElements member object.
 * Allows for easy retrieval of DICOM tag values from the tag name.
 * If tags have same name (for the 'unknown' and private tags cases), a number is appended
 * making the name unique.
 * @method appendDicomElement
 * @param {Object} element The element to add.
 */
dwv.dicom.DicomParser.prototype.appendDicomElement = function( element )
{
    // find a good tag name
    var name = element.name;
    // count the number of items
    if( name === "Item" ) {
        ++this.numberOfItems;
    }
    var count = 1;
    while( this.dicomElements[name] ) {
        name = element.name + (count++).toString();
    }
    // store it
    this.dicomElements[name] = { 
        "group": element.group, 
        "element": element.element,
        "vr": element.vr,
        "vl": element.vl,
        "value": element.value 
    };
};

/**
 * Read a DICOM tag.
 * @method readTag
 * @param reader The raw data reader.
 * @param offset The offset where to start to read.
 * @returns An object containing the tags 'group', 'element' and 'name'.
 */
dwv.dicom.DicomParser.prototype.readTag = function(reader, offset)
{
    // group
    var group = reader.readHex(offset);
    // element
    var element = reader.readHex(offset+2);
    // name
    var name = "dwv::unknown";
    if( dwv.dicom.dictionary[group] ) {
        if( dwv.dicom.dictionary[group][element] ) {
            name = dwv.dicom.dictionary[group][element][2];
        }
    }
    // return
    return {'group': group, 'element': element, 'name': name};
};

/**
 * Read a DICOM data element.
 * @method readDataElement
 * @param reader The raw data reader.
 * @param offset The offset where to start to read.
 * @param implicit Is the DICOM VR implicit?
 * @returns {Object} An object containing the element 'tag', 'vl', 'vr', 'data' and 'offset'.
 */
dwv.dicom.DicomParser.prototype.readDataElement = function(reader, offset, implicit)
{
    // tag: group, element
    var tag = this.readTag(reader, offset);
    var tagOffset = 4;
    
    var vr; // Value Representation (VR)
    var vl; // Value Length (VL)
    var vrOffset = 0; // byte size of VR
    var vlOffset = 0; // byte size of VL
    
    // (private) Item group case
    if( tag.group === "0xFFFE" ) {
        vr = "N/A";
        vrOffset = 0;
        vl = reader.readUint32( offset+tagOffset );
        vlOffset = 4;
    }
    // non Item case
    else {
        // implicit VR?
        if(implicit) {
            vr = "UN";
            if( dwv.dicom.dictionary[tag.group] ) {
                if( dwv.dicom.dictionary[tag.group][tag.element] ) {
                    vr = dwv.dicom.dictionary[tag.group][tag.element][0];
                }
            }
            vrOffset = 0;
            vl = reader.readUint32( offset+tagOffset+vrOffset );
            vlOffset = 4;
        }
        else {
            vr = reader.readString( offset+tagOffset, 2 );
            vrOffset = 2;
            // long representations
            if(vr === "OB" || vr === "OF" || vr === "SQ" || vr === "OW" || vr === "UN") {
                vl = reader.readUint32( offset+tagOffset+vrOffset+2 );
                vlOffset = 6;
            }
            // short representation
            else {
                vl = reader.readUint16( offset+tagOffset+vrOffset );
                vlOffset = 2;
            }
        }
    }
    
    // check the value of VL
    if( vl === 0xffffffff ) {
        vl = 0;
    }
    
    
    // data
    var data;
    var dataOffset = offset+tagOffset+vrOffset+vlOffset;
    if( vr === "US" || vr === "UL")
    {
        data = [reader.readNumber( dataOffset, vl )];
    }
    else if( vr === "OW" )
    {
        data = reader.readUint16Array( dataOffset, vl );
    }
    else if( vr === "OB" || vr === "N/A")
    {
        data = reader.readUint8Array( dataOffset, vl );
    }
    else if( vr === "OX" )
    {
        console.warn("OX value representation for tag: "+tag.name+".");
        if ( typeof(this.dicomElements.BitsAllocated) !== 'undefined' &&
                this.dicomElements.BitsAllocated.value[0] === 8 ) {
            data = reader.readUint8Array( dataOffset, vl );
        }
        else {
            data = reader.readUint16Array( dataOffset, vl );
        }
    }
    else
    {
        data = reader.readString( dataOffset, vl);
        data = data.split("\\");                
    }    

    // total element offset
    var elementOffset = tagOffset + vrOffset + vlOffset + vl;
    
    // return
    return { 
        'tag': tag, 
        'vr': vr, 
        'vl': vl, 
        'data': data,
        'offset': elementOffset
    };    
};

/**
 * Parse the complete DICOM file (given as input to the class).
 * Fills in the member object 'dicomElements'.
 * @method parse
 * @param buffer The input array buffer.
 */
dwv.dicom.DicomParser.prototype.parse = function(buffer)
{
    var offset = 0;
    var implicit = false;
    var jpeg = false;
    var jpeg2000 = false;
    // default readers
    var metaReader = new dwv.dicom.DataReader(buffer);
    var dataReader = new dwv.dicom.DataReader(buffer);

    // 128 -> 132: magic word
    offset = 128;
    var magicword = metaReader.readString( offset, 4 );
    if(magicword !== "DICM")
    {
        throw new Error("Not a valid DICOM file (no magic DICM word found)");
    }
    offset += 4;
    
    // 0x0002, 0x0000: MetaElementGroupLength
    var dataElement = this.readDataElement(metaReader, offset);
    var metaLength = parseInt(dataElement.data, 10);
    offset += dataElement.offset;
    
    // meta elements
    var metaStart = offset;
    var metaEnd = metaStart + metaLength;
    var i = metaStart;
    while( i < metaEnd ) 
    {
        // get the data element
        dataElement = this.readDataElement(metaReader, i, false);
        // check the transfer syntax
        if( dataElement.tag.name === "TransferSyntaxUID" ) {
            var syntax = dwv.utils.cleanString(dataElement.data[0]);
            
            // Implicit VR - Little Endian
            if( syntax === "1.2.840.10008.1.2" ) {
                implicit = true;
            }
            // Explicit VR - Little Endian (default): 1.2.840.10008.1.2.1 
            // Deflated Explicit VR - Little Endian
            else if( syntax === "1.2.840.10008.1.2.1.99" ) {
                throw new Error("Unsupported DICOM transfer syntax (Deflated Explicit VR): "+syntax);
            }
            // Explicit VR - Big Endian
            else if( syntax === "1.2.840.10008.1.2.2" ) {
                dataReader = new dwv.dicom.DataReader(buffer,false);
            }
            // JPEG
            else if( dwv.dicom.isJpegTransferSyntax(syntax) ) {
                jpeg = true;
                //console.log("JPEG compressed DICOM data: " + syntax);
                throw new Error("Unsupported DICOM transfer syntax (JPEG): "+syntax);
            }
            // JPEG-LS
            else if( dwv.dicom.isJpeglsTransferSyntax(syntax) ) {
                //console.log("JPEG-LS compressed DICOM data: " + syntax);
                throw new Error("Unsupported DICOM transfer syntax (JPEG-LS): "+syntax);
            }
            // JPEG 2000
            else if( dwv.dicom.isJpeg2000TransferSyntax(syntax) ) {
                console.log("JPEG 2000 compressed DICOM data: " + syntax);
                jpeg2000 = true;
            }
            // MPEG2 Image Compression
            else if( syntax === "1.2.840.10008.1.2.4.100" ) {
                throw new Error("Unsupported DICOM transfer syntax (MPEG2): "+syntax);
            }
            // RLE (lossless)
            else if( syntax === "1.2.840.10008.1.2.4.5" ) {
                throw new Error("Unsupported DICOM transfer syntax (RLE): "+syntax);
            }
        }            
        // store the data element
        this.appendDicomElement( { 
            'name': dataElement.tag.name,
            'group': dataElement.tag.group, 
            'vr' : dataElement.vr, 
            'vl' : dataElement.vl, 
            'element': dataElement.tag.element,
            'value': dataElement.data 
        });
        // increment index
        i += dataElement.offset;
    }
    
    var startedPixelItems = false;
    
    var tagName = "";
    // DICOM data elements
    while( i < buffer.byteLength ) 
    {
        // get the data element
        try
        {
            dataElement = this.readDataElement(dataReader, i, implicit);
        }
        catch(err)
        {
            console.warn("Problem reading at " + i + " / " + buffer.byteLength +
                ", after " + tagName + ".\n" + err);
        }
        tagName = dataElement.tag.name;
        // store pixel data from multiple items
        if( startedPixelItems ) {
            if( tagName === "Item" ) {
                if( dataElement.data.length === 4 ) {
                    console.log("Skipping Basic Offset Table.");
                }
                else if( dataElement.data.length !== 0 ) {
                    console.log("Concatenating multiple pixel data items, length: "+dataElement.data.length);
                    // concat does not work on typed arrays
                    //this.pixelBuffer = this.pixelBuffer.concat( dataElement.data );
                    // manual concat...
                    var size = dataElement.data.length + this.pixelBuffer.length;
                    var newBuffer = new Uint16Array(size);
                    newBuffer.set( this.pixelBuffer, 0 );
                    newBuffer.set( dataElement.data, this.pixelBuffer.length );
                    this.pixelBuffer = newBuffer;
                }
            }
            else if( tagName === "SequenceDelimitationItem" ) {
                startedPixelItems = false;
            }
            else {
                throw new Error("Unexpected tag in encapsulated pixel data: "+dataElement.tag.name);
            }
        }
        // check the pixel data tag
        if( tagName === "PixelData") {
            if( dataElement.data.length !== 0 ) {
                this.pixelBuffer = dataElement.data;
            }
            else {
                startedPixelItems = true;
            }
        }
        // store the data element
        this.appendDicomElement( {
            'name': tagName,
            'group' : dataElement.tag.group, 
            'vr' : dataElement.vr, 
            'vl' : dataElement.vl, 
            'element': dataElement.tag.element,
            'value': dataElement.data 
        });
        // increment index
        i += dataElement.offset;
    }
    
    // uncompress data
    if( jpeg ) {
        // using jpgjs from https://github.com/notmasteryet/jpgjs
        // -> error with ffc3 and ffc1 jpeg jfif marker
        /*var j = new JpegImage();
        j.parse(this.pixelBuffer);
        var d = 0;
        j.copyToImageData(d);
        this.pixelBuffer = d.data;*/
    }
    else if( jpeg2000 ) {
        // decompress pixel buffer into Uint8 image
        var uint8Image = null;
        try {
            uint8Image = openjpeg(this.pixelBuffer, "j2k");
        } catch(error) {
            throw new Error("Cannot decode JPEG 2000 ([" +error.name + "] " + error.message + ")");
        }
        this.pixelBuffer = uint8Image.data;
    }
};

/**
 * Get an Image object from the read DICOM file.
 * @method createImage
 * @returns {View} A new Image.
 */
dwv.dicom.DicomParser.prototype.createImage = function()
{
    // size
    if( !this.dicomElements.Columns ) {
        throw new Error("Missing DICOM image number of columns");
    }
    if( !this.dicomElements.Rows ) {
        throw new Error("Missing DICOM image number of rows");
    }
    var size = new dwv.image.Size(
        this.dicomElements.Columns.value[0], 
        this.dicomElements.Rows.value[0] );
    // spacing
    var rowSpacing = 1;
    var columnSpacing = 1;
    if( this.dicomElements.PixelSpacing ) {
        rowSpacing = parseFloat(this.dicomElements.PixelSpacing.value[0]);
        columnSpacing = parseFloat(this.dicomElements.PixelSpacing.value[1]);
    }
    else if( this.dicomElements.ImagerPixelSpacing ) {
        rowSpacing = parseFloat(this.dicomElements.ImagerPixelSpacing.value[0]);
        columnSpacing = parseFloat(this.dicomElements.ImagerPixelSpacing.value[1]);
    }
    var spacing = new dwv.image.Spacing( columnSpacing, rowSpacing);

    // special jpeg 2000 case: openjpeg returns a Uint8 planar MONO or RGB image
    var syntax = dwv.utils.cleanString(
        this.dicomElements.TransferSyntaxUID.value[0] );
    var jpeg2000 = dwv.dicom.isJpeg2000TransferSyntax( syntax );
    
    // buffer data
    var buffer = null;
    // convert to 16bit if needed
    if( jpeg2000 && this.dicomElements.BitsAllocated.value[0] === 16 )
    {
        var sliceSize = size.getSliceSize();
        buffer = new Int16Array( sliceSize );
        var k = 0;
        for( var p = 0; p < sliceSize; ++p ) {
            buffer[p] = 256 * this.pixelBuffer[k] + this.pixelBuffer[k+1];
            k += 2;
        }
    }
    else
    {
        buffer = new Int16Array(this.pixelBuffer.length);
        // unsigned to signed data if needed
        var shift = false;
        if( this.dicomElements.PixelRepresentation &&
                this.dicomElements.PixelRepresentation.value[0] == 1) {
            shift = true;
        }
        // copy
        for( var i=0; i<this.pixelBuffer.length; ++i ) {
            buffer[i] = this.pixelBuffer[i];
            if( shift && buffer[i] >= Math.pow(2, 15) ) {
                buffer[i] -= Math.pow(2, 16);
            }
        }
    }
    
    // slice position
    var slicePosition = new Array(0,0,0);
    if( this.dicomElements.ImagePositionPatient ) {
        slicePosition = [ parseFloat(this.dicomElements.ImagePositionPatient.value[0]),
            parseFloat(this.dicomElements.ImagePositionPatient.value[1]),
            parseFloat(this.dicomElements.ImagePositionPatient.value[2]) ];
    }
    
    // image
    var image = new dwv.image.Image( size, spacing, buffer, [slicePosition] );
    // photometricInterpretation
    if( this.dicomElements.PhotometricInterpretation ) {
        var photo = dwv.utils.cleanString(
            this.dicomElements.PhotometricInterpretation.value[0]).toUpperCase();
        if( jpeg2000 && photo.match(/YBR/) ) {
            photo = "RGB";
        }
        image.setPhotometricInterpretation( photo );
    }        
    // planarConfiguration
    if( this.dicomElements.PlanarConfiguration ) {
        var planar = this.dicomElements.PlanarConfiguration.value[0];
        if( jpeg2000 ) {
            planar = 1;
        }
        image.setPlanarConfiguration( planar );
    }        
    // rescale slope
    if( this.dicomElements.RescaleSlope ) {
        image.setRescaleSlope( parseFloat(this.dicomElements.RescaleSlope.value[0]) );
    }
    // rescale intercept
    if( this.dicomElements.RescaleIntercept ) {
        image.setRescaleIntercept( parseFloat(this.dicomElements.RescaleIntercept.value[0]) );
    }
    // meta information
    var meta = {};
    if( this.dicomElements.Modality ) {
        meta.Modality = this.dicomElements.Modality.value[0];
    }
    if( this.dicomElements.StudyInstanceUID ) {
        meta.StudyInstanceUID = this.dicomElements.StudyInstanceUID.value[0];
    }
    if( this.dicomElements.SeriesInstanceUID ) {
        meta.SeriesInstanceUID = this.dicomElements.SeriesInstanceUID.value[0];
    }
    if( this.dicomElements.BitsStored ) {
        meta.BitsStored = parseInt(this.dicomElements.BitsStored.value[0], 10);
    }
    image.setMeta(meta);
    
    // pixel representation
    var isSigned = 0;
    if( this.dicomElements.PixelRepresentation ) {
        isSigned = this.dicomElements.PixelRepresentation.value[0];
    }
    // view
    var view = new dwv.image.View(image, isSigned);
    // window center and width
    var windowPresets = [];
    if( this.dicomElements.WindowCenter && this.dicomElements.WindowWidth ) {
        var name;
        for( var j = 0; j < this.dicomElements.WindowCenter.value.length; ++j) {
            var width = parseFloat( this.dicomElements.WindowWidth.value[j], 10 );
            if( width !== 0 ) {
                if( this.dicomElements.WindowCenterWidthExplanation ) {
                    name = this.dicomElements.WindowCenterWidthExplanation.value[j];
                }
                else {
                    name = "Default"+j;
                }
                windowPresets.push({
                    "center": parseFloat( this.dicomElements.WindowCenter.value[j], 10 ),
                    "width": width, 
                    "name": name
                });
            }
        }
    }
    if( windowPresets.length !== 0 ) {
        view.setWindowPresets( windowPresets );
    }
    else {
        view.setWindowLevelMinMax();
    }

    return view;
};

/** 
 * DICOM module.
 * @module dicom
 */
var dwv = dwv || {};
dwv.dicom = dwv.dicom || {};

/**
 * DICOM tag dictionary.
 * @namespace dwv.dicom
 */
dwv.dicom.dictionary = {
    '0x0000': {
        '0x0000': ['UL', '1', 'GroupLength'],
        '0x0001': ['UL', '1', 'CommandLengthToEnd'],
        '0x0002': ['UI', '1', 'AffectedSOPClassUID'],
        '0x0003': ['UI', '1', 'RequestedSOPClassUID'],
        '0x0010': ['CS', '1', 'CommandRecognitionCode'],
        '0x0100': ['US', '1', 'CommandField'],
        '0x0110': ['US', '1', 'MessageID'],
        '0x0120': ['US', '1', 'MessageIDBeingRespondedTo'],
        '0x0200': ['AE', '1', 'Initiator'], 
        '0x0300': ['AE', '1', 'Receiver'],
        '0x0400': ['AE', '1', 'FindLocation'],
        '0x0600': ['AE', '1', 'MoveDestination'],
        '0x0700': ['US', '1', 'Priority'],
        '0x0800': ['US', '1', 'DataSetType'],
        '0x0850': ['US', '1', 'NumberOfMatches'],
        '0x0860': ['US', '1', 'ResponseSequenceNumber'],
        '0x0900': ['US', '1', 'Status'],
        '0x0901': ['AT', '1-n', 'OffendingElement'],
        '0x0902': ['LO', '1', 'ErrorComment'],
        '0x0903': ['US', '1', 'ErrorID'],
        '0x0904': ['OT', '1-n', 'ErrorInformation'],
        '0x1000': ['UI', '1', 'AffectedSOPInstanceUID'],
        '0x1001': ['UI', '1', 'RequestedSOPInstanceUID'],
        '0x1002': ['US', '1', 'EventTypeID'],
        '0x1003': ['OT', '1-n', 'EventInformation'],
        '0x1005': ['AT', '1-n', 'AttributeIdentifierList'],
        '0x1007': ['AT', '1-n', 'ModificationList'],
        '0x1008': ['US', '1', 'ActionTypeID'],
        '0x1009': ['OT', '1-n', 'ActionInformation'],
        '0x1013': ['UI', '1-n', 'SuccessfulSOPInstanceUIDList'],
        '0x1014': ['UI', '1-n', 'FailedSOPInstanceUIDList'],
        '0x1015': ['UI', '1-n', 'WarningSOPInstanceUIDList'],
        '0x1020': ['US', '1', 'NumberOfRemainingSuboperations'],
        '0x1021': ['US', '1', 'NumberOfCompletedSuboperations'],
        '0x1022': ['US', '1', 'NumberOfFailedSuboperations'],
        '0x1023': ['US', '1', 'NumberOfWarningSuboperations'],
        '0x1030': ['AE', '1', 'MoveOriginatorApplicationEntityTitle'],
        '0x1031': ['US', '1', 'MoveOriginatorMessageID'],
        '0x4000': ['AT', '1', 'DialogReceiver'],
        '0x4010': ['AT', '1', 'TerminalType'],
        '0x5010': ['SH', '1', 'MessageSetID'],
        '0x5020': ['SH', '1', 'EndMessageSet'],
        '0x5110': ['AT', '1', 'DisplayFormat'],
        '0x5120': ['AT', '1', 'PagePositionID'],
        '0x5130': ['CS', '1', 'TextFormatID'],
        '0x5140': ['CS', '1', 'NormalReverse'],
        '0x5150': ['CS', '1', 'AddGrayScale'],
        '0x5160': ['CS', '1', 'Borders'],
        '0x5170': ['IS', '1', 'Copies'],
        '0x5180': ['CS', '1', 'OldMagnificationType'],
        '0x5190': ['CS', '1', 'Erase'],
        '0x51A0': ['CS', '1', 'Print'],
        '0x51B0': ['US', '1-n', 'Overlays'],
    },
    '0x0002': {
        '0x0000': ['UL', '1', 'MetaElementGroupLength'],
        '0x0001': ['OB', '1', 'FileMetaInformationVersion'],
        '0x0002': ['UI', '1', 'MediaStorageSOPClassUID'],
        '0x0003': ['UI', '1', 'MediaStorageSOPInstanceUID'],
        '0x0010': ['UI', '1', 'TransferSyntaxUID'],
        '0x0012': ['UI', '1', 'ImplementationClassUID'],
        '0x0013': ['SH', '1', 'ImplementationVersionName'],
        '0x0016': ['AE', '1', 'SourceApplicationEntityTitle'],
        '0x0100': ['UI', '1', 'PrivateInformationCreatorUID'],
        '0x0102': ['OB', '1', 'PrivateInformation'],
    },
    '0x0004': {
        '0x0000': ['UL', '1', 'FileSetGroupLength'],
        '0x1130': ['CS', '1', 'FileSetID'],
        '0x1141': ['CS', '8', 'FileSetDescriptorFileID'],
        '0x1142': ['CS', '1', 'FileSetCharacterSet'],
        '0x1200': ['UL', '1', 'RootDirectoryFirstRecord'],
        '0x1202': ['UL', '1', 'RootDirectoryLastRecord'],
        '0x1212': ['US', '1', 'FileSetConsistencyFlag'],
        '0x1220': ['SQ', '1', 'DirectoryRecordSequence'],
        '0x1400': ['UL', '1', 'NextDirectoryRecordOffset'],
        '0x1410': ['US', '1', 'RecordInUseFlag'],
        '0x1420': ['UL', '1', 'LowerLevelDirectoryOffset'],
        '0x1430': ['CS', '1', 'DirectoryRecordType'],
        '0x1432': ['UI', '1', 'PrivateRecordUID'],
        '0x1500': ['CS', '8', 'ReferencedFileID'],
        '0x1504': ['UL', '1', 'DirectoryRecordOffset'],
        '0x1510': ['UI', '1', 'ReferencedSOPClassUIDInFile'],
        '0x1511': ['UI', '1', 'ReferencedSOPInstanceUIDInFile'],
        '0x1512': ['UI', '1', 'ReferencedTransferSyntaxUIDInFile'],
        '0x1600': ['UL', '1', 'NumberOfReferences'],
    },
    '0x0008': {
        '0x0000': ['UL', '1', 'IdentifyingGroupLength'],
        '0x0001': ['UL', '1', 'LengthToEnd'],
        '0x0005': ['CS', '1', 'SpecificCharacterSet'],
        '0x0008': ['CS', '1-n', 'ImageType'],
        '0x000A': ['US', '1', 'SequenceItemNumber'],
        '0x0010': ['CS', '1', 'RecognitionCode'],
        '0x0012': ['DA', '1', 'InstanceCreationDate'],
        '0x0013': ['TM', '1', 'InstanceCreationTime'],
        '0x0014': ['UI', '1', 'InstanceCreatorUID'],
        '0x0016': ['UI', '1', 'SOPClassUID'],
        '0x0018': ['UI', '1', 'SOPInstanceUID'],
        '0x0020': ['DA', '1', 'StudyDate'],
        '0x0021': ['DA', '1', 'SeriesDate'],
        '0x0022': ['DA', '1', 'AcquisitionDate'],
        '0x0023': ['DA', '1', 'ImageDate'],
        /* '0x0023': ['DA','1','ContentDate'], */
        '0x0024': ['DA', '1', 'OverlayDate'],
        '0x0025': ['DA', '1', 'CurveDate'],
        '0x002A': ['DT', '1', 'AcquisitionDatetime'],
        '0x0030': ['TM', '1', 'StudyTime'],
        '0x0031': ['TM', '1', 'SeriesTime'],
        '0x0032': ['TM', '1', 'AcquisitionTime'],
        '0x0033': ['TM', '1', 'ImageTime'],
        '0x0034': ['TM', '1', 'OverlayTime'],
        '0x0035': ['TM', '1', 'CurveTime'],
        '0x0040': ['US', '1', 'OldDataSetType'],
        '0x0041': ['LT', '1', 'OldDataSetSubtype'],
        '0x0042': ['CS', '1', 'NuclearMedicineSeriesType'],
        '0x0050': ['SH', '1', 'AccessionNumber'],
        '0x0052': ['CS', '1', 'QueryRetrieveLevel'],
        '0x0054': ['AE', '1-n', 'RetrieveAETitle'],
        '0x0058': ['UI', '1-n', 'DataSetFailedSOPInstanceUIDList'],
        '0x0060': ['CS', '1', 'Modality'],
        '0x0061': ['CS', '1-n', 'ModalitiesInStudy'],
        '0x0064': ['CS', '1', 'ConversionType'],
        '0x0068': ['CS', '1', 'PresentationIntentType'],
        '0x0070': ['LO', '1', 'Manufacturer'],
        '0x0080': ['LO', '1', 'InstitutionName'],
        '0x0081': ['ST', '1', 'InstitutionAddress'],
        '0x0082': ['SQ', '1', 'InstitutionCodeSequence'],
        '0x0090': ['PN', '1', 'ReferringPhysicianName'],
        '0x0092': ['ST', '1', 'ReferringPhysicianAddress'],
        '0x0094': ['SH', '1-n', 'ReferringPhysicianTelephoneNumber'],
        '0x0100': ['SH', '1', 'CodeValue'],
        '0x0102': ['SH', '1', 'CodingSchemeDesignator'],
        '0x0103': ['SH', '1', 'CodingSchemeVersion'],
        '0x0104': ['LO', '1', 'CodeMeaning'],
        '0x0105': ['CS', '1', 'MappingResource'],
        '0x0106': ['DT', '1', 'ContextGroupVersion'],
        '0x0107': ['DT', '1', 'ContextGroupLocalVersion'],
        '0x010B': ['CS', '1', 'CodeSetExtensionFlag'],
        '0x010C': ['UI', '1', 'PrivateCodingSchemeCreatorUID'],
        '0x010D': ['UI', '1', 'CodeSetExtensionCreatorUID'],
        '0x010F': ['CS', '1', 'ContextIdentifier'],
        '0x0201': ['SH', '1', 'TimezoneOffsetFromUTC'],
        '0x1000': ['AE', '1', 'NetworkID'],
        '0x1010': ['SH', '1', 'StationName'],
        '0x1030': ['LO', '1', 'StudyDescription'],
        '0x1032': ['SQ', '1', 'ProcedureCodeSequence'],
        '0x103E': ['LO', '1', 'SeriesDescription'],
        '0x1040': ['LO', '1', 'InstitutionalDepartmentName'],
        '0x1048': ['PN', '1-n', 'PhysicianOfRecord'],
        '0x1050': ['PN', '1-n', 'PerformingPhysicianName'],
        '0x1060': ['PN', '1-n', 'PhysicianReadingStudy'],
        '0x1070': ['PN', '1-n', 'OperatorName'],
        '0x1080': ['LO', '1-n', 'AdmittingDiagnosisDescription'],
        '0x1084': ['SQ', '1', 'AdmittingDiagnosisCodeSequence'],
        '0x1090': ['LO', '1', 'ManufacturerModelName'],
        '0x1100': ['SQ', '1', 'ReferencedResultsSequence'],
        '0x1110': ['SQ', '1', 'ReferencedStudySequence'],
        '0x1111': ['SQ', '1', 'ReferencedStudyComponentSequence'],
        '0x1115': ['SQ', '1', 'ReferencedSeriesSequence'],
        '0x1120': ['SQ', '1', 'ReferencedPatientSequence'],
        '0x1125': ['SQ', '1', 'ReferencedVisitSequence'],
        '0x1130': ['SQ', '1', 'ReferencedOverlaySequence'],
        '0x1140': ['SQ', '1', 'ReferencedImageSequence'],
        '0x1145': ['SQ', '1', 'ReferencedCurveSequence'],
        '0x114A': ['SQ', '1', 'ReferencedInstanceSequence'],
        '0x114B': ['LO', '1', 'ReferenceDescription'],
        '0x1150': ['UI', '1', 'ReferencedSOPClassUID'],
        '0x1155': ['UI', '1', 'ReferencedSOPInstanceUID'],
        '0x115A': ['UI', '1-n', 'SOPClassesSupported'],
        '0x1160': ['IS', '1', 'ReferencedFrameNumber'],
        '0x1195': ['UI', '1', 'TransactionUID'],
        '0x1197': ['US', '1', 'FailureReason'],
        '0x1198': ['SQ', '1', 'FailedSOPSequence'],
        '0x1199': ['SQ', '1', 'ReferencedSOPSequence'],
        '0x2110': ['CS', '1', 'LossyImageCompression'],
        '0x2111': ['ST', '1', 'DerivationDescription'],
        '0x2112': ['SQ', '1', 'SourceImageSequence'],
        '0x2120': ['SH', '1', 'StageName'],
        '0x2122': ['IS', '1', 'StageNumber'],
        '0x2124': ['IS', '1', 'NumberOfStages'],
        '0x2128': ['IS', '1', 'ViewNumber'],
        '0x2129': ['IS', '1', 'NumberOfEventTimers'],
        '0x212A': ['IS', '1', 'NumberOfViewsInStage'],
        '0x2130': ['DS', '1-n', 'EventElapsedTime'],
        '0x2132': ['LO', '1-n', 'EventTimerName'],
        '0x2142': ['IS', '1', 'StartTrim'],
        '0x2143': ['IS', '1', 'StopTrim'],
        '0x2144': ['IS', '1', 'RecommendedDisplayFrameRate'],
        '0x2200': ['CS', '1', 'TransducerPosition'],
        '0x2204': ['CS', '1', 'TransducerOrientation'],
        '0x2208': ['CS', '1', 'AnatomicStructure'],
        '0x2218': ['SQ', '1', 'AnatomicRegionSequence'],
        '0x2220': ['SQ', '1', 'AnatomicRegionModifierSequence'],
        '0x2228': ['SQ', '1', 'PrimaryAnatomicStructureSequence'],
        '0x2229': ['SQ', '1', 'AnatomicStructureSpaceOrRegionSequence'],
        '0x2230': ['SQ', '1', 'PrimaryAnatomicStructureModifierSequence'],
        '0x2240': ['SQ', '1', 'TransducerPositionSequence'],
        '0x2242': ['SQ', '1', 'TransducerPositionModifierSequence'],
        '0x2244': ['SQ', '1', 'TransducerOrientationSequence'],
        '0x2246': ['SQ', '1', 'TransducerOrientationModifierSequence'],
        '0x4000': ['LT', '1-n', 'IdentifyingComments'],
    },
    '0x0010': {
        '0x0000': ['UL', '1', 'PatientGroupLength'],
        '0x0010': ['PN', '1', 'PatientName'],
        '0x0020': ['LO', '1', 'PatientID'],
        '0x0021': ['LO', '1', 'IssuerOfPatientID'],
        '0x0030': ['DA', '1', 'PatientBirthDate'],
        '0x0032': ['TM', '1', 'PatientBirthTime'],
        '0x0040': ['CS', '1', 'PatientSex'],
        '0x0050': ['SQ', '1', 'PatientInsurancePlanCodeSequence'],
        '0x1000': ['LO', '1-n', 'OtherPatientID'],
        '0x1001': ['PN', '1-n', 'OtherPatientName'],
        '0x1005': ['PN', '1', 'PatientBirthName'],
        '0x1010': ['AS', '1', 'PatientAge'],
        '0x1020': ['DS', '1', 'PatientSize'],
        '0x1030': ['DS', '1', 'PatientWeight'],
        '0x1040': ['LO', '1', 'PatientAddress'],
        '0x1050': ['LT', '1-n', 'InsurancePlanIdentification'],
        '0x1060': ['PN', '1', 'PatientMotherBirthName'],
        '0x1080': ['LO', '1', 'MilitaryRank'],
        '0x1081': ['LO', '1', 'BranchOfService'],
        '0x1090': ['LO', '1', 'MedicalRecordLocator'],
        '0x2000': ['LO', '1-n', 'MedicalAlerts'],
        '0x2110': ['LO', '1-n', 'ContrastAllergies'],
        '0x2150': ['LO', '1', 'CountryOfResidence'],
        '0x2152': ['LO', '1', 'RegionOfResidence'],
        '0x2154': ['SH', '1-n', 'PatientTelephoneNumber'],
        '0x2160': ['SH', '1', 'EthnicGroup'],
        '0x2180': ['SH', '1', 'Occupation'],
        '0x21A0': ['CS', '1', 'SmokingStatus'],
        '0x21B0': ['LT', '1', 'AdditionalPatientHistory'],
        '0x21C0': ['US', '1', 'PregnancyStatus'],
        '0x21D0': ['DA', '1', 'LastMenstrualDate'],
        '0x21F0': ['LO', '1', 'PatientReligiousPreference'],
        '0x4000': ['LT', '1', 'PatientComments'],
    },
    '0x0018': {
        '0x0000': ['UL', '1', 'AcquisitionGroupLength'],
        '0x0010': ['LO', '1', 'ContrastBolusAgent'],
        '0x0012': ['SQ', '1', 'ContrastBolusAgentSequence'],
        '0x0014': ['SQ', '1', 'ContrastBolusAdministrationRouteSequence'],
        '0x0015': ['CS', '1', 'BodyPartExamined'],
        '0x0020': ['CS', '1-n', 'ScanningSequence'],
        '0x0021': ['CS', '1-n', 'SequenceVariant'],
        '0x0022': ['CS', '1-n', 'ScanOptions'],
        '0x0023': ['CS', '1', 'MRAcquisitionType'],
        '0x0024': ['SH', '1', 'SequenceName'],
        '0x0025': ['CS', '1', 'AngioFlag'],
        '0x0026': ['SQ', '1', 'InterventionDrugInformationSequence'],
        '0x0027': ['TM', '1', 'InterventionDrugStopTime'],
        '0x0028': ['DS', '1', 'InterventionDrugDose'],
        '0x0029': ['SQ', '1', 'InterventionalDrugSequence'],
        '0x002A': ['SQ', '1', 'AdditionalDrugSequence'],
        '0x0030': ['LO', '1-n', 'Radionuclide'],
        '0x0031': ['LO', '1-n', 'Radiopharmaceutical'],
        '0x0032': ['DS', '1', 'EnergyWindowCenterline'],
        '0x0033': ['DS', '1-n', 'EnergyWindowTotalWidth'],
        '0x0034': ['LO', '1', 'InterventionalDrugName'],
        '0x0035': ['TM', '1', 'InterventionalDrugStartTime'],
        '0x0036': ['SQ', '1', 'InterventionalTherapySequence'],
        '0x0037': ['CS', '1', 'TherapyType'],
        '0x0038': ['CS', '1', 'InterventionalStatus'],
        '0x0039': ['CS', '1', 'TherapyDescription'],
        '0x0040': ['IS', '1', 'CineRate'],
        '0x0050': ['DS', '1', 'SliceThickness'],
        '0x0060': ['DS', '1', 'KVP'],
        '0x0070': ['IS', '1', 'CountsAccumulated'],
        '0x0071': ['CS', '1', 'AcquisitionTerminationCondition'],
        '0x0072': ['DS', '1', 'EffectiveSeriesDuration'],
        '0x0073': ['CS', '1', 'AcquisitionStartCondition'],
        '0x0074': ['IS', '1', 'AcquisitionStartConditionData'],
        '0x0075': ['IS', '1', 'AcquisitionTerminationConditionData'],
        '0x0080': ['DS', '1', 'RepetitionTime'],
        '0x0081': ['DS', '1', 'EchoTime'],
        '0x0082': ['DS', '1', 'InversionTime'],
        '0x0083': ['DS', '1', 'NumberOfAverages'],
        '0x0084': ['DS', '1', 'ImagingFrequency'],
        '0x0085': ['SH', '1', 'ImagedNucleus'],
        '0x0086': ['IS', '1-n', 'EchoNumber'],
        '0x0087': ['DS', '1', 'MagneticFieldStrength'],
        '0x0088': ['DS', '1', 'SpacingBetweenSlices'],
        '0x0089': ['IS', '1', 'NumberOfPhaseEncodingSteps'],
        '0x0090': ['DS', '1', 'DataCollectionDiameter'],
        '0x0091': ['IS', '1', 'EchoTrainLength'],
        '0x0093': ['DS', '1', 'PercentSampling'],
        '0x0094': ['DS', '1', 'PercentPhaseFieldOfView'],
        '0x0095': ['DS', '1', 'PixelBandwidth'],
        '0x1000': ['LO', '1', 'DeviceSerialNumber'],
        '0x1002': ['UI', '1', 'DeviceUID'],
        '0x1003': ['LO', '1', 'DeviceID'],
        '0x1004': ['LO', '1', 'PlateID'],
        '0x1005': ['LO', '1', 'GeneratorID'],
        '0x1006': ['LO', '1', 'GridID'],
        '0x1007': ['LO', '1', 'CassetteID'],
        '0x1008': ['LO', '1', 'GantryID'],
        '0x1010': ['LO', '1', 'SecondaryCaptureDeviceID'],
        '0x1011': ['LO', '1', 'HardcopyCreationDeviceID'],
        '0x1012': ['DA', '1', 'DateOfSecondaryCapture'],
        '0x1014': ['TM', '1', 'TimeOfSecondaryCapture'],
        '0x1016': ['LO', '1', 'SecondaryCaptureDeviceManufacturer'],
        '0x1017': ['LO', '1', 'HardcopyDeviceManufacturer'],
        '0x1018': ['LO', '1', 'SecondaryCaptureDeviceManufacturerModelName'],
        '0x1019': ['LO', '1-n', 'SecondaryCaptureDeviceSoftwareVersion'],
        '0x101A': ['LO', '1-n', 'HardcopyDeviceSoftwareVersion'],
        '0x101B': ['LO', '1', 'HardcopyDeviceManfuacturersModelName'],
        '0x1020': ['LO', '1-n', 'SoftwareVersion'],
        '0x1022': ['SH', '1', 'VideoImageFormatAcquired'],
        '0x1023': ['LO', '1', 'DigitalImageFormatAcquired'],
        '0x1030': ['LO', '1', 'ProtocolName'],
        '0x1040': ['LO', '1', 'ContrastBolusRoute'],
        '0x1041': ['DS', '1', 'ContrastBolusVolume'],
        '0x1042': ['TM', '1', 'ContrastBolusStartTime'],
        '0x1043': ['TM', '1', 'ContrastBolusStopTime'],
        '0x1044': ['DS', '1', 'ContrastBolusTotalDose'],
        '0x1045': ['IS', '1-n', 'SyringeCounts'],
        '0x1046': ['DS', '1-n', 'ContrastFlowRate'],
        '0x1047': ['DS', '1-n', 'ContrastFlowDuration'],
        '0x1048': ['CS', '1', 'ContrastBolusIngredient'],
        '0x1049': ['DS', '1', 'ContrastBolusIngredientConcentration'],
        '0x1050': ['DS', '1', 'SpatialResolution'],
        '0x1060': ['DS', '1', 'TriggerTime'],
        '0x1061': ['LO', '1', 'TriggerSourceOrType'],
        '0x1062': ['IS', '1', 'NominalInterval'],
        '0x1063': ['DS', '1', 'FrameTime'],
        '0x1064': ['LO', '1', 'FramingType'],
        '0x1065': ['DS', '1-n', 'FrameTimeVector'],
        '0x1066': ['DS', '1', 'FrameDelay'],
        '0x1067': ['DS', '1', 'ImageTriggerDelay'],
        '0x1068': ['DS', '1', 'MultiplexGroupTimeOffset'],
        '0x1069': ['DS', '1', 'TriggerTimeOffset'],
        '0x106A': ['CS', '1', 'SynchronizationTrigger'],
        '0x106C': ['US', '2', 'SynchronizationChannel'],
        '0x106E': ['UL', '1', 'TriggerSamplePosition'],
        '0x1070': ['LO', '1-n', 'RadionuclideRoute'],
        '0x1071': ['DS', '1-n', 'RadionuclideVolume'],
        '0x1072': ['TM', '1-n', 'RadionuclideStartTime'],
        '0x1073': ['TM', '1-n', 'RadionuclideStopTime'],
        '0x1074': ['DS', '1-n', 'RadionuclideTotalDose'],
        '0x1075': ['DS', '1', 'RadionuclideHalfLife'],
        '0x1076': ['DS', '1', 'RadionuclidePositronFraction'],
        '0x1077': ['DS', '1', 'RadiopharmaceuticalSpecificActivity'],
        '0x1080': ['CS', '1', 'BeatRejectionFlag'],
        '0x1081': ['IS', '1', 'LowRRValue'],
        '0x1082': ['IS', '1', 'HighRRValue'],
        '0x1083': ['IS', '1', 'IntervalsAcquired'],
        '0x1084': ['IS', '1', 'IntervalsRejected'],
        '0x1085': ['LO', '1', 'PVCRejection'],
        '0x1086': ['IS', '1', 'SkipBeats'],
        '0x1088': ['IS', '1', 'HeartRate'],
        '0x1090': ['IS', '1', 'CardiacNumberOfImages'],
        '0x1094': ['IS', '1', 'TriggerWindow'],
        '0x1100': ['DS', '1', 'ReconstructionDiameter'],
        '0x1110': ['DS', '1', 'DistanceSourceToDetector'],
        '0x1111': ['DS', '1', 'DistanceSourceToPatient'],
        '0x1114': ['DS', '1', 'EstimatedRadiographicMagnificationFactor'],
        '0x1120': ['DS', '1', 'GantryDetectorTilt'],
        '0x1121': ['DS', '1', 'GantryDetectorSlew'],
        '0x1130': ['DS', '1', 'TableHeight'],
        '0x1131': ['DS', '1', 'TableTraverse'],
        '0x1134': ['DS', '1', 'TableMotion'],
        '0x1135': ['DS', '1-n', 'TableVerticalIncrement'],
        '0x1136': ['DS', '1-n', 'TableLateralIncrement'],
        '0x1137': ['DS', '1-n', 'TableLongitudinalIncrement'],
        '0x1138': ['DS', '1', 'TableAngle'],
        '0x113A': ['CS', '1', 'TableType'],
        '0x1140': ['CS', '1', 'RotationDirection'],
        '0x1141': ['DS', '1', 'AngularPosition'],
        '0x1142': ['DS', '1-n', 'RadialPosition'],
        '0x1143': ['DS', '1', 'ScanArc'],
        '0x1144': ['DS', '1', 'AngularStep'],
        '0x1145': ['DS', '1', 'CenterOfRotationOffset'],
        '0x1146': ['DS', '1-n', 'RotationOffset'],
        '0x1147': ['CS', '1', 'FieldOfViewShape'],
        '0x1149': ['IS', '2', 'FieldOfViewDimension'],
        '0x1150': ['IS', '1', 'ExposureTime'],
        '0x1151': ['IS', '1', 'XrayTubeCurrent'],
        '0x1152': ['IS', '1', 'Exposure'],
        '0x1153': ['IS', '1', 'ExposureinuAs'],
        '0x1154': ['DS', '1', 'AveragePulseWidth'],
        '0x1155': ['CS', '1', 'RadiationSetting'],
        '0x1156': ['CS', '1', 'RectificationType'],
        '0x115A': ['CS', '1', 'RadiationMode'],
        '0x115E': ['DS', '1', 'ImageAreaDoseProduct'],
        '0x1160': ['SH', '1', 'FilterType'],
        '0x1161': ['LO', '1-n', 'TypeOfFilters'],
        '0x1162': ['DS', '1', 'IntensifierSize'],
        '0x1164': ['DS', '2', 'ImagerPixelSpacing'],
        '0x1166': ['CS', '1', 'Grid'],
        '0x1170': ['IS', '1', 'GeneratorPower'],
        '0x1180': ['SH', '1', 'CollimatorGridName'],
        '0x1181': ['CS', '1', 'CollimatorType'],
        '0x1182': ['IS', '1', 'FocalDistance'],
        '0x1183': ['DS', '1', 'XFocusCenter'],
        '0x1184': ['DS', '1', 'YFocusCenter'],
        '0x1190': ['DS', '1-n', 'FocalSpot'],
        '0x1191': ['CS', '1', 'AnodeTargetMaterial'],
        '0x11A0': ['DS', '1', 'BodyPartThickness'],
        '0x11A2': ['DS', '1', 'CompressionForce'],
        '0x1200': ['DA', '1-n', 'DateOfLastCalibration'],
        '0x1201': ['TM', '1-n', 'TimeOfLastCalibration'],
        '0x1210': ['SH', '1-n', 'ConvolutionKernel'],
        '0x1240': ['IS', '1-n', 'UpperLowerPixelValues'],
        '0x1242': ['IS', '1', 'ActualFrameDuration'],
        '0x1243': ['IS', '1', 'CountRate'],
        '0x1244': ['US', '1', 'PreferredPlaybackSequencing'],
        '0x1250': ['SH', '1', 'ReceivingCoil'],
        '0x1251': ['SH', '1', 'TransmittingCoil'],
        '0x1260': ['SH', '1', 'PlateType'],
        '0x1261': ['LO', '1', 'PhosphorType'],
        '0x1300': ['IS', '1', 'ScanVelocity'],
        '0x1301': ['CS', '1-n', 'WholeBodyTechnique'],
        '0x1302': ['IS', '1', 'ScanLength'],
        '0x1310': ['US', '4', 'AcquisitionMatrix'],
        '0x1312': ['CS', '1', 'PhaseEncodingDirection'],
        '0x1314': ['DS', '1', 'FlipAngle'],
        '0x1315': ['CS', '1', 'VariableFlipAngleFlag'],
        '0x1316': ['DS', '1', 'SAR'],
        '0x1318': ['DS', '1', 'dBdt'],
        '0x1400': ['LO', '1', 'AcquisitionDeviceProcessingDescription'],
        '0x1401': ['LO', '1', 'AcquisitionDeviceProcessingCode'],
        '0x1402': ['CS', '1', 'CassetteOrientation'],
        '0x1403': ['CS', '1', 'CassetteSize'],
        '0x1404': ['US', '1', 'ExposuresOnPlate'],
        '0x1405': ['IS', '1', 'RelativeXrayExposure'],
        '0x1450': ['DS', '1', 'ColumnAngulation'],
        '0x1460': ['DS', '1', 'TomoLayerHeight'],
        '0x1470': ['DS', '1', 'TomoAngle'],
        '0x1480': ['DS', '1', 'TomoTime'],
        '0x1490': ['CS', '1', 'TomoType'],
        '0x1491': ['CS', '1', 'TomoClass'],
        '0x1495': ['IS', '1', 'NumberofTomosynthesisSourceImages'],
        '0x1500': ['CS', '1', 'PositionerMotion'],
        '0x1508': ['CS', '1', 'PositionerType'],
        '0x1510': ['DS', '1', 'PositionerPrimaryAngle'],
        '0x1511': ['DS', '1', 'PositionerSecondaryAngle'],
        '0x1520': ['DS', '1-n', 'PositionerPrimaryAngleIncrement'],
        '0x1521': ['DS', '1-n', 'PositionerSecondaryAngleIncrement'],
        '0x1530': ['DS', '1', 'DetectorPrimaryAngle'],
        '0x1531': ['DS', '1', 'DetectorSecondaryAngle'],
        '0x1600': ['CS', '3', 'ShutterShape'],
        '0x1602': ['IS', '1', 'ShutterLeftVerticalEdge'],
        '0x1604': ['IS', '1', 'ShutterRightVerticalEdge'],
        '0x1606': ['IS', '1', 'ShutterUpperHorizontalEdge'],
        '0x1608': ['IS', '1', 'ShutterLowerHorizontalEdge'],
        '0x1610': ['IS', '1', 'CenterOfCircularShutter'],
        '0x1612': ['IS', '1', 'RadiusOfCircularShutter'],
        '0x1620': ['IS', '1-n', 'VerticesOfPolygonalShutter'],
        '0x1622': ['US', '1', 'ShutterPresentationValue'],
        '0x1623': ['US', '1', 'ShutterOverlayGroup'],
        '0x1700': ['CS', '3', 'CollimatorShape'],
        '0x1702': ['IS', '1', 'CollimatorLeftVerticalEdge'],
        '0x1704': ['IS', '1', 'CollimatorRightVerticalEdge'],
        '0x1706': ['IS', '1', 'CollimatorUpperHorizontalEdge'],
        '0x1708': ['IS', '1', 'CollimatorLowerHorizontalEdge'],
        '0x1710': ['IS', '1', 'CenterOfCircularCollimator'],
        '0x1712': ['IS', '1', 'RadiusOfCircularCollimator'],
        '0x1720': ['IS', '1-n', 'VerticesOfPolygonalCollimator'],
        '0x1800': ['CS', '1', 'AcquisitionTimeSynchronized'],
        '0x1801': ['SH', '1', 'TimeSource'],
        '0x1802': ['CS', '1', 'TimeDistributionProtocol'],
        '0x1810': ['DT', '1', 'AcquisitionTimestamp'],
        '0x4000': ['LT', '1-n', 'AcquisitionComments'],
        '0x5000': ['SH', '1-n', 'OutputPower'],
        '0x5010': ['LO', '3', 'TransducerData'],
        '0x5012': ['DS', '1', 'FocusDepth'],
        '0x5020': ['LO', '1', 'PreprocessingFunction'],
        '0x5021': ['LO', '1', 'PostprocessingFunction'],
        '0x5022': ['DS', '1', 'MechanicalIndex'],
        '0x5024': ['DS', '1', 'ThermalIndex'],
        '0x5026': ['DS', '1', 'CranialThermalIndex'],
        '0x5027': ['DS', '1', 'SoftTissueThermalIndex'],
        '0x5028': ['DS', '1', 'SoftTissueFocusThermalIndex'],
        '0x5029': ['DS', '1', 'SoftTissueSurfaceThermalIndex'],
        '0x5030': ['DS', '1', 'DynamicRange'],
        '0x5040': ['DS', '1', 'TotalGain'],
        '0x5050': ['IS', '1', 'DepthOfScanField'],
        '0x5100': ['CS', '1', 'PatientPosition'],
        '0x5101': ['CS', '1', 'ViewPosition'],
        '0x5104': ['SQ', '1', 'ProjectionEponymousNameCodeSequence'],
        '0x5210': ['DS', '6', 'ImageTransformationMatrix'],
        '0x5212': ['DS', '3', 'ImageTranslationVector'],
        '0x6000': ['DS', '1', 'Sensitivity'],
        '0x6011': ['SQ', '1', 'SequenceOfUltrasoundRegions'],
        '0x6012': ['US', '1', 'RegionSpatialFormat'],
        '0x6014': ['US', '1', 'RegionDataType'],
        '0x6016': ['UL', '1', 'RegionFlags'],
        '0x6018': ['UL', '1', 'RegionLocationMinX0'],
        '0x601A': ['UL', '1', 'RegionLocationMinY0'],
        '0x601C': ['UL', '1', 'RegionLocationMaxX1'],
        '0x601E': ['UL', '1', 'RegionLocationMaxY1'],
        '0x6020': ['SL', '1', 'ReferencePixelX0'],
        '0x6022': ['SL', '1', 'ReferencePixelY0'],
        '0x6024': ['US', '1', 'PhysicalUnitsXDirection'],
        '0x6026': ['US', '1', 'PhysicalUnitsYDirection'],
        '0x6028': ['FD', '1', 'ReferencePixelPhysicalValueX'],
        '0x602A': ['FD', '1', 'ReferencePixelPhysicalValueY'],
        '0x602C': ['FD', '1', 'PhysicalDeltaX'],
        '0x602E': ['FD', '1', 'PhysicalDeltaY'],
        '0x6030': ['UL', '1', 'TransducerFrequency'],
        '0x6031': ['CS', '1', 'TransducerType'],
        '0x6032': ['UL', '1', 'PulseRepetitionFrequency'],
        '0x6034': ['FD', '1', 'DopplerCorrectionAngle'],
        '0x6036': ['FD', '1', 'SteeringAngle'],
        '0x6038': ['UL', '1', 'DopplerSampleVolumeXPosition'],
        '0x603A': ['UL', '1', 'DopplerSampleVolumeYPosition'],
        '0x603C': ['UL', '1', 'TMLinePositionX0'],
        '0x603E': ['UL', '1', 'TMLinePositionY0'],
        '0x6040': ['UL', '1', 'TMLinePositionX1'],
        '0x6042': ['UL', '1', 'TMLinePositionY1'],
        '0x6044': ['US', '1', 'PixelComponentOrganization'],
        '0x6046': ['UL', '1', 'PixelComponentMask'],
        '0x6048': ['UL', '1', 'PixelComponentRangeStart'],
        '0x604A': ['UL', '1', 'PixelComponentRangeStop'],
        '0x604C': ['US', '1', 'PixelComponentPhysicalUnits'],
        '0x604E': ['US', '1', 'PixelComponentDataType'],
        '0x6050': ['UL', '1', 'NumberOfTableBreakPoints'],
        '0x6052': ['UL', '1-n', 'TableOfXBreakPoints'],
        '0x6054': ['FD', '1-n', 'TableOfYBreakPoints'],
        '0x6056': ['UL', '1', 'NumberOfTableEntries'],
        '0x6058': ['UL', '1-n', 'TableOfPixelValues'],
        '0x605A': ['FL', '1-n', 'TableOfParameterValues'],
        '0x7000': ['CS', '1', 'DetectorConditionsNominalFlag'],
        '0x7001': ['DS', '1', 'DetectorTemperature'],
        '0x7004': ['CS', '1', 'DetectorType'],
        '0x7005': ['CS', '1', 'DetectorConfiguration'],
        '0x7006': ['LT', '1', 'DetectorDescription'],
        '0x7008': ['LT', '1', 'DetectorMode'],
        '0x700A': ['SH', '1', 'DetectorID'],
        '0x700C': ['DA', '1', 'DateofLastDetectorCalibration'],
        '0x700E': ['TM', '1', 'TimeofLastDetectorCalibration'],
        '0x7010': ['IS', '1', 'ExposuresOnDetectorSinceLastCalibration'],
        '0x7011': ['IS', '1', 'ExposuresOnDetectorSinceManufactured'],
        '0x7012': ['DS', '1', 'DetectorTimeSinceLastExposure'],
        '0x7014': ['DS', '1', 'DetectorActiveTime'],
        '0x7016': ['DS', '1', 'DetectorActivationOffsetFromExposure'],
        '0x701A': ['DS', '2', 'DetectorBinning'],
        '0x7020': ['DS', '2', 'DetectorElementPhysicalSize'],
        '0x7022': ['DS', '2', 'DetectorElementSpacing'],
        '0x7024': ['CS', '1', 'DetectorActiveShape'],
        '0x7026': ['DS', '1-2', 'DetectorActiveDimensions'],
        '0x7028': ['DS', '2', 'DetectorActiveOrigin'],
        '0x7030': ['DS', '2', 'FieldofViewOrigin'],
        '0x7032': ['DS', '1', 'FieldofViewRotation'],
        '0x7034': ['CS', '1', 'FieldofViewHorizontalFlip'],
        '0x7040': ['LT', '1', 'GridAbsorbingMaterial'],
        '0x7041': ['LT', '1', 'GridSpacingMaterial'],
        '0x7042': ['DS', '1', 'GridThickness'],
        '0x7044': ['DS', '1', 'GridPitch'],
        '0x7046': ['IS', '2', 'GridAspectRatio'],
        '0x7048': ['DS', '1', 'GridPeriod'],
        '0x704C': ['DS', '1', 'GridFocalDistance'],
        '0x7050': ['LT', '1-n', 'FilterMaterial'],
        '0x7052': ['DS', '1-n', 'FilterThicknessMinimum'],
        '0x7054': ['DS', '1-n', 'FilterThicknessMaximum'],
        '0x7060': ['CS', '1', 'ExposureControlMode'],
        '0x7062': ['LT', '1', 'ExposureControlModeDescription'],
        '0x7064': ['CS', '1', 'ExposureStatus'],
        '0x7065': ['DS', '1', 'PhototimerSetting'],
    },
    '0x0020': {
        '0x0000': ['UL', '1', 'ImageGroupLength'],
        '0x000D': ['UI', '1', 'StudyInstanceUID'],
        '0x000E': ['UI', '1', 'SeriesInstanceUID'],
        '0x0010': ['SH', '1', 'StudyID'],
        '0x0011': ['IS', '1', 'SeriesNumber'],
        '0x0012': ['IS', '1', 'AcquisitionNumber'],
        '0x0013': ['IS', '1', 'ImageNumber'],
        '0x0014': ['IS', '1', 'IsotopeNumber'],
        '0x0015': ['IS', '1', 'PhaseNumber'],
        '0x0016': ['IS', '1', 'IntervalNumber'],
        '0x0017': ['IS', '1', 'TimeSlotNumber'],
        '0x0018': ['IS', '1', 'AngleNumber'],
        '0x0019': ['IS', '1', 'ItemNumber'],
        '0x0020': ['CS', '2', 'PatientOrientation'],
        '0x0022': ['IS', '1', 'OverlayNumber'],
        '0x0024': ['IS', '1', 'CurveNumber'],
        '0x0026': ['IS', '1', 'LUTNumber'],
        '0x0030': ['DS', '3', 'ImagePosition'],
        '0x0032': ['DS', '3', 'ImagePositionPatient'],
        '0x0035': ['DS', '6', 'ImageOrientation'],
        '0x0037': ['DS', '6', 'ImageOrientationPatient'],
        '0x0050': ['DS', '1', 'Location'],
        '0x0052': ['UI', '1', 'FrameOfReferenceUID'],
        '0x0060': ['CS', '1', 'Laterality'],
        '0x0062': ['CS', '1', 'ImageLaterality'],
        '0x0070': ['LT', '1', 'ImageGeometryType'],
        '0x0080': ['CS', '1-n', 'MaskingImage'],
        '0x0100': ['IS', '1', 'TemporalPositionIdentifier'],
        '0x0105': ['IS', '1', 'NumberOfTemporalPositions'],
        '0x0110': ['DS', '1', 'TemporalResolution'],
        '0x0200': ['UI', '1', 'SynchronizationFrameofReferenceUID'],
        '0x1000': ['IS', '1', 'SeriesInStudy'],
        '0x1001': ['IS', '1', 'AcquisitionsInSeries'],
        '0x1002': ['IS', '1', 'ImagesInAcquisition'],
        '0x1003': ['IS', '1', 'ImagesInSeries'],
        '0x1004': ['IS', '1', 'AcquisitionsInStudy'],
        '0x1005': ['IS', '1', 'ImagesInStudy'],
        '0x1020': ['CS', '1-n', 'Reference'],
        '0x1040': ['LO', '1', 'PositionReferenceIndicator'],
        '0x1041': ['DS', '1', 'SliceLocation'],
        '0x1070': ['IS', '1-n', 'OtherStudyNumbers'],
        '0x1200': ['IS', '1', 'NumberOfPatientRelatedStudies'],
        '0x1202': ['IS', '1', 'NumberOfPatientRelatedSeries'],
        '0x1204': ['IS', '1', 'NumberOfPatientRelatedImages'],
        '0x1206': ['IS', '1', 'NumberOfStudyRelatedSeries'],
        '0x1208': ['IS', '1', 'NumberOfStudyRelatedImages'],
        '0x1209': ['IS', '1', 'NumberOfSeriesRelatedInstances'],
        '0x3100': ['CS', '1-n', 'SourceImageID'],
        '0x3401': ['CS', '1', 'ModifyingDeviceID'],
        '0x3402': ['CS', '1', 'ModifiedImageID'],
        '0x3403': ['DA', '1', 'ModifiedImageDate'],
        '0x3404': ['LO', '1', 'ModifyingDeviceManufacturer'],
        '0x3405': ['TM', '1', 'ModifiedImageTime'],
        '0x3406': ['LT', '1', 'ModifiedImageDescription'],
        '0x4000': ['LT', '1', 'ImageComments'],
        '0x5000': ['AT', '1-n', 'OriginalImageIdentification'],
        '0x5002': ['CS', '1-n', 'OriginalImageIdentificationNomenclature'],
    },
    '0x0028': {
        '0x0000': ['UL', '1', 'ImagePresentationGroupLength'],
        '0x0002': ['US', '1', 'SamplesPerPixel'],
        '0x0004': ['CS', '1', 'PhotometricInterpretation'],
        '0x0005': ['US', '1', 'ImageDimensions'],
        '0x0006': ['US', '1', 'PlanarConfiguration'],
        '0x0008': ['IS', '1', 'NumberOfFrames'],
        '0x0009': ['AT', '1', 'FrameIncrementPointer'],
        '0x0010': ['US', '1', 'Rows'],
        '0x0011': ['US', '1', 'Columns'],
        '0x0012': ['US', '1', 'Planes'],
        '0x0014': ['US', '1', 'UltrasoundColorDataPresent'],
        '0x0030': ['DS', '2', 'PixelSpacing'],
        '0x0031': ['DS', '2', 'ZoomFactor'],
        '0x0032': ['DS', '2', 'ZoomCenter'],
        '0x0034': ['IS', '2', 'PixelAspectRatio'],
        '0x0040': ['CS', '1', 'ImageFormat'],
        '0x0050': ['LT', '1-n', 'ManipulatedImage'],
        '0x0051': ['CS', '1', 'CorrectedImage'],
        '0x005F': ['CS', '1', 'CompressionRecognitionCode'],
        '0x0060': ['CS', '1', 'CompressionCode'],
        '0x0061': ['SH', '1', 'CompressionOriginator'],
        '0x0062': ['SH', '1', 'CompressionLabel'],
        '0x0063': ['SH', '1', 'CompressionDescription'],
        '0x0065': ['CS', '1-n', 'CompressionSequence'],
        '0x0066': ['AT', '1-n', 'CompressionStepPointers'],
        '0x0068': ['US', '1', 'RepeatInterval'],
        '0x0069': ['US', '1', 'BitsGrouped'],
        '0x0070': ['US', '1-n', 'PerimeterTable'],
        '0x0071': ['XS', '1', 'PerimeterValue'],
        '0x0080': ['US', '1', 'PredictorRows'],
        '0x0081': ['US', '1', 'PredictorColumns'],
        '0x0082': ['US', '1-n', 'PredictorConstants'],
        '0x0090': ['CS', '1', 'BlockedPixels'],
        '0x0091': ['US', '1', 'BlockRows'],
        '0x0092': ['US', '1', 'BlockColumns'],
        '0x0093': ['US', '1', 'RowOverlap'],
        '0x0094': ['US', '1', 'ColumnOverlap'],
        '0x0100': ['US', '1', 'BitsAllocated'],
        '0x0101': ['US', '1', 'BitsStored'],
        '0x0102': ['US', '1', 'HighBit'],
        '0x0103': ['US', '1', 'PixelRepresentation'],
        '0x0104': ['XS', '1', 'SmallestValidPixelValue'],
        '0x0105': ['XS', '1', 'LargestValidPixelValue'],
        '0x0106': ['XS', '1', 'SmallestImagePixelValue'],
        '0x0107': ['XS', '1', 'LargestImagePixelValue'],
        '0x0108': ['XS', '1', 'SmallestPixelValueInSeries'],
        '0x0109': ['XS', '1', 'LargestPixelValueInSeries'],
        '0x0110': ['XS', '1', 'SmallestPixelValueInPlane'],
        '0x0111': ['XS', '1', 'LargestPixelValueInPlane'],
        '0x0120': ['XS', '1', 'PixelPaddingValue'],
        '0x0200': ['US', '1', 'ImageLocation'],
        '0x0300': ['CS', '1', 'QualityControlImage'],
        '0x0301': ['CS', '1', 'BurnedInAnnotation'],
        '0x0400': ['CS', '1', 'TransformLabel'],
        '0x0401': ['CS', '1', 'TransformVersionNumber'],
        '0x0402': ['US', '1', 'NumberOfTransformSteps'],
        '0x0403': ['CS', '1-n', 'SequenceOfCompressedData'],
        '0x0404': ['AT', '1-n', 'DetailsOfCoefficients'],
        '0x0410': ['US', '1', 'RowsForNthOrderCoefficients'],
        '0x0411': ['US', '1', 'ColumnsForNthOrderCoefficients'],
        '0x0412': ['CS', '1-n', 'CoefficientCoding'],
        '0x0413': ['AT', '1-n', 'CoefficientCodingPointers'],
        '0x0700': ['CS', '1', 'DCTLabel'],
        '0x0701': ['CS', '1-n', 'DataBlockDescription'],
        '0x0702': ['AT', '1-n', 'DataBlock'],
        '0x0710': ['US', '1', 'NormalizationFactorFormat'],
        '0x0720': ['US', '1', 'ZonalMapNumberFormat'],
        '0x0721': ['AT', '1-n', 'ZonalMapLocation'],
        '0x0722': ['US', '1', 'ZonalMapFormat'],
        '0x0730': ['US', '1', 'AdaptiveMapFormat'],
        '0x0740': ['US', '1', 'CodeNumberFormat'],
        '0x0800': ['CS', '1-n', 'CodeLabel'],
        '0x0802': ['US', '1', 'NumberOfTables'],
        '0x0803': ['AT', '1-n', 'CodeTableLocation'],
        '0x0804': ['US', '1', 'BitsForCodeWord'],
        '0x0808': ['AT', '1-n', 'ImageDataLocation'],
        '0x1040': ['CS', '1', 'PixelIntensityRelationship'],
        '0x1041': ['SS', '1', 'PixelIntensityRelationshipSign'],
        '0x1050': ['DS', '1-n', 'WindowCenter'],
        '0x1051': ['DS', '1-n', 'WindowWidth'],
        '0x1052': ['DS', '1', 'RescaleIntercept'],
        '0x1053': ['DS', '1', 'RescaleSlope'],
        '0x1054': ['LO', '1', 'RescaleType'],
        '0x1055': ['LO', '1-n', 'WindowCenterWidthExplanation'],
        '0x1080': ['CS', '1', 'GrayScale'],
        '0x1090': ['CS', '1', 'RecommendedViewingMode'],
        '0x1100': ['XS', '3', 'GrayLookupTableDescriptor'],
        '0x1101': ['XS', '3', 'RedPaletteColorLookupTableDescriptor'],
        '0x1102': ['XS', '3', 'GreenPaletteColorLookupTableDescriptor'],
        '0x1103': ['XS', '3', 'BluePaletteColorLookupTableDescriptor'],
        '0x1111': ['US', '4', 'LargeRedPaletteColorLookupTableDescriptor'],
        '0x1112': ['US', '4', 'LargeGreenPaletteColorLookupTabe'],
        '0x1113': ['US', '4', 'LargeBluePaletteColorLookupTabl'],
        '0x1199': ['UI', '1', 'PaletteColorLookupTableUID'],
        '0x1200': ['XS', '1-n', 'GrayLookupTableData'],
        '0x1201': ['XS', '1-n', 'RedPaletteColorLookupTableData'],
        '0x1202': ['XS', '1-n', 'GreenPaletteColorLookupTableData'],
        '0x1203': ['XS', '1-n', 'BluePaletteColorLookupTableData'],
        '0x1211': ['OW', '1', 'LargeRedPaletteColorLookupTableData'],
        '0x1212': ['OW', '1', 'LargeGreenPaletteColorLookupTableData'],
        '0x1213': ['OW', '1', 'LargeBluePaletteColorLookupTableData'],
        '0x1214': ['UI', '1', 'LargePaletteColorLookupTableUID'],
        '0x1221': ['OW', '1', 'SegmentedRedPaletteColorLookupTableData'],
        '0x1222': ['OW', '1', 'SegmentedGreenPaletteColorLookupTableData'],
        '0x1223': ['OW', '1', 'SegmentedBluePaletteColorLookupTableData'],
        '0x1300': ['CS', '1', 'ImplantPresent'],
        '0x2110': ['CS', '1', 'LossyImageCompression'],
        '0x2112': ['DS', '1-n', 'LossyImageCompressionRatio'],
        '0x3000': ['SQ', '1', 'ModalityLUTSequence'],
        '0x3002': ['XS', '3', 'LUTDescriptor'],
        '0x3003': ['LO', '1', 'LUTExplanation'],
        '0x3004': ['LO', '1', 'ModalityLUTType'],
        '0x3006': ['XS', '1-n', 'LUTData'],
        '0x3010': ['SQ', '1', 'VOILUTSequence'],
        '0x3110': ['SQ', '1', 'SoftcopyVOILUTSequence'],
        '0x4000': ['LT', '1-n', 'ImagePresentationComments'],
        '0x5000': ['SQ', '1', 'BiPlaneAcquisitionSequence'],
        '0x6010': ['US', '1', 'RepresentativeFrameNumber'],
        '0x6020': ['US', '1-n', 'FrameNumbersOfInterest'],
        '0x6022': ['LO', '1-n', 'FrameOfInterestDescription'],
        '0x6030': ['US', '1-n', 'MaskPointer'],
        '0x6040': ['US', '1-n', 'RWavePointer'],
        '0x6100': ['SQ', '1', 'MaskSubtractionSequence'],
        '0x6101': ['CS', '1', 'MaskOperation'],
        '0x6102': ['US', '1-n', 'ApplicableFrameRange'],
        '0x6110': ['US', '1-n', 'MaskFrameNumbers'],
        '0x6112': ['US', '1', 'ContrastFrameAveraging'],
        '0x6114': ['FL', '2', 'MaskSubPixelShift'],
        '0x6120': ['SS', '1', 'TIDOffset'],
        '0x6190': ['ST', '1', 'MaskOperationExplanation'],
    },
    '0x0032': {
        '0x0000': ['UL', '1', 'StudyGroupLength'],
        '0x000A': ['CS', '1', 'StudyStatusID'],
        '0x000C': ['CS', '1', 'StudyPriorityID'],
        '0x0012': ['LO', '1', 'StudyIDIssuer'],
        '0x0032': ['DA', '1', 'StudyVerifiedDate'],
        '0x0033': ['TM', '1', 'StudyVerifiedTime'],
        '0x0034': ['DA', '1', 'StudyReadDate'],
        '0x0035': ['TM', '1', 'StudyReadTime'],
        '0x1000': ['DA', '1', 'ScheduledStudyStartDate'],
        '0x1001': ['TM', '1', 'ScheduledStudyStartTime'],
        '0x1010': ['DA', '1', 'ScheduledStudyStopDate'],
        '0x1011': ['TM', '1', 'ScheduledStudyStopTime'],
        '0x1020': ['LO', '1', 'ScheduledStudyLocation'],
        '0x1021': ['AE', '1-n', 'ScheduledStudyLocationAETitle'],
        '0x1030': ['LO', '1', 'ReasonForStudy'],
        '0x1032': ['PN', '1', 'RequestingPhysician'],
        '0x1033': ['LO', '1', 'RequestingService'],
        '0x1040': ['DA', '1', 'StudyArrivalDate'],
        '0x1041': ['TM', '1', 'StudyArrivalTime'],
        '0x1050': ['DA', '1', 'StudyCompletionDate'],
        '0x1051': ['TM', '1', 'StudyCompletionTime'],
        '0x1055': ['CS', '1', 'StudyComponentStatusID'],
        '0x1060': ['LO', '1', 'RequestedProcedureDescription'],
        '0x1064': ['SQ', '1', 'RequestedProcedureCodeSequence'],
        '0x1070': ['LO', '1', 'RequestedContrastAgent'],
        '0x4000': ['LT', '1', 'StudyComments'],
    },
    '0x0038': {
        '0x0000': ['UL', '1', 'VisitGroupLength'],
        '0x0004': ['SQ', '1', 'ReferencedPatientAliasSequence'],
        '0x0008': ['CS', '1', 'VisitStatusID'],
        '0x0010': ['LO', '1', 'AdmissionID'],
        '0x0011': ['LO', '1', 'IssuerOfAdmissionID'],
        '0x0016': ['LO', '1', 'RouteOfAdmissions'],
        '0x001A': ['DA', '1', 'ScheduledAdmissionDate'],
        '0x001B': ['TM', '1', 'ScheduledAdmissionTime'],
        '0x001C': ['DA', '1', 'ScheduledDischargeDate'],
        '0x001D': ['TM', '1', 'ScheduledDischargeTime'],
        '0x001E': ['LO', '1', 'ScheduledPatientInstitutionResidence'],
        '0x0020': ['DA', '1', 'AdmittingDate'],
        '0x0021': ['TM', '1', 'AdmittingTime'],
        '0x0030': ['DA', '1', 'DischargeDate'],
        '0x0032': ['TM', '1', 'DischargeTime'],
        '0x0040': ['LO', '1', 'DischargeDiagnosisDescription'],
        '0x0044': ['SQ', '1', 'DischargeDiagnosisCodeSequence'],
        '0x0050': ['LO', '1', 'SpecialNeeds'],
        '0x0300': ['LO', '1', 'CurrentPatientLocation'],
        '0x0400': ['LO', '1', 'PatientInstitutionResidence'],
        '0x0500': ['LO', '1', 'PatientState'],
        '0x4000': ['LT', '1', 'VisitComments'],
    },
    '0x003A': {
        '0x0004': ['CS', '1', 'WaveformOriginality'],
        '0x0005': ['US', '1', 'NumberofChannels'],
        '0x0010': ['UL', '1', 'NumberofSamples'],
        '0x001A': ['DS', '1', 'SamplingFrequency'],
        '0x0020': ['SH', '1', 'MultiplexGroupLabel'],
        '0x0200': ['SQ', '1', 'ChannelDefinitionSequence'],
        '0x0202': ['IS', '1', 'WVChannelNumber'],
        '0x0203': ['SH', '1', 'ChannelLabel'],
        '0x0205': ['CS', '1-n', 'ChannelStatus'],
        '0x0208': ['SQ', '1', 'ChannelSourceSequence'],
        '0x0209': ['SQ', '1', 'ChannelSourceModifiersSequence'],
        '0x020A': ['SQ', '1', 'SourceWaveformSequence'],
        '0x020C': ['LO', '1', 'ChannelDerivationDescription'],
        '0x0210': ['DS', '1', 'ChannelSensitivity'],
        '0x0211': ['SQ', '1', 'ChannelSensitivityUnits'],
        '0x0212': ['DS', '1', 'ChannelSensitivityCorrectionFactor'],
        '0x0213': ['DS', '1', 'ChannelBaseline'],
        '0x0214': ['DS', '1', 'ChannelTimeSkew'],
        '0x0215': ['DS', '1', 'ChannelSampleSkew'],
        '0x0218': ['DS', '1', 'ChannelOffset'],
        '0x021A': ['US', '1', 'WaveformBitsStored'],
        '0x0220': ['DS', '1', 'FilterLowFrequency'],
        '0x0221': ['DS', '1', 'FilterHighFrequency'],
        '0x0222': ['DS', '1', 'NotchFilterFrequency'],
        '0x0223': ['DS', '1', 'NotchFilterBandwidth'],
    },
    '0x0040': {
        '0x0000': ['UL', '1', 'ModalityWorklistGroupLength'],
        '0x0001': ['AE', '1', 'ScheduledStationAETitle'],
        '0x0002': ['DA', '1', 'ScheduledProcedureStepStartDate'],
        '0x0003': ['TM', '1', 'ScheduledProcedureStepStartTime'],
        '0x0004': ['DA', '1', 'ScheduledProcedureStepEndDate'],
        '0x0005': ['TM', '1', 'ScheduledProcedureStepEndTime'],
        '0x0006': ['PN', '1', 'ScheduledPerformingPhysicianName'],
        '0x0007': ['LO', '1', 'ScheduledProcedureStepDescription'],
        '0x0008': ['SQ', '1', 'ScheduledProcedureStepCodeSequence'],
        '0x0009': ['SH', '1', 'ScheduledProcedureStepID'],
        '0x0010': ['SH', '1', 'ScheduledStationName'],
        '0x0011': ['SH', '1', 'ScheduledProcedureStepLocation'],
        '0x0012': ['LO', '1', 'ScheduledPreOrderOfMedication'],
        '0x0020': ['CS', '1', 'ScheduledProcedureStepStatus'],
        '0x0100': ['SQ', '1-n', 'ScheduledProcedureStepSequence'],
        '0x0220': ['SQ', '1', 'ReferencedStandaloneSOPInstanceSequence'],
        '0x0241': ['AE', '1', 'PerformedStationAETitle'],
        '0x0242': ['SH', '1', 'PerformedStationName'],
        '0x0243': ['SH', '1', 'PerformedLocation'],
        '0x0244': ['DA', '1', 'PerformedProcedureStepStartDate'],
        '0x0245': ['TM', '1', 'PerformedProcedureStepStartTime'],
        '0x0250': ['DA', '1', 'PerformedProcedureStepEndDate'],
        '0x0251': ['TM', '1', 'PerformedProcedureStepEndTime'],
        '0x0252': ['CS', '1', 'PerformedProcedureStepStatus'],
        '0x0253': ['CS', '1', 'PerformedProcedureStepID'],
        '0x0254': ['LO', '1', 'PerformedProcedureStepDescription'],
        '0x0255': ['LO', '1', 'PerformedProcedureTypeDescription'],
        '0x0260': ['SQ', '1', 'PerformedActionItemSequence'],
        '0x0270': ['SQ', '1', 'ScheduledStepAttributesSequence'],
        '0x0275': ['SQ', '1', 'RequestAttributesSequence'],
        '0x0280': ['ST', '1', 'CommentsOnThePerformedProcedureSteps'],
        '0x0293': ['SQ', '1', 'QuantitySequence'],
        '0x0294': ['DS', '1', 'Quantity'],
        '0x0295': ['SQ', '1', 'MeasuringUnitsSequence'],
        '0x0296': ['SQ', '1', 'BillingItemSequence'],
        '0x0300': ['US', '1', 'TotalTimeOfFluoroscopy'],
        '0x0301': ['US', '1', 'TotalNumberOfExposures'],
        '0x0302': ['US', '1', 'EntranceDose'],
        '0x0303': ['US', '1-2', 'ExposedArea'],
        '0x0306': ['DS', '1', 'DistanceSourceToEntrance'],
        '0x0307': ['DS', '1', 'DistanceSourceToSupport'],
        '0x0310': ['ST', '1', 'CommentsOnRadiationDose'],
        '0x0312': ['DS', '1', 'XRayOutput'],
        '0x0314': ['DS', '1', 'HalfValueLayer'],
        '0x0316': ['DS', '1', 'OrganDose'],
        '0x0318': ['CS', '1', 'OrganExposed'],
        '0x0320': ['SQ', '1', 'BillingProcedureStepSequence'],
        '0x0321': ['SQ', '1', 'FilmConsumptionSequence'],
        '0x0324': ['SQ', '1', 'BillingSuppliesAndDevicesSequence'],
        '0x0330': ['SQ', '1', 'ReferencedProcedureStepSequence'],
        '0x0340': ['SQ', '1', 'PerformedSeriesSequence'],
        '0x0400': ['LT', '1', 'CommentsOnScheduledProcedureStep'],
        '0x050A': ['LO', '1', 'SpecimenAccessionNumber'],
        '0x0550': ['SQ', '1', 'SpecimenSequence'],
        '0x0551': ['LO', '1', 'SpecimenIdentifier'],
        '0x0555': ['SQ', '1', 'AcquisitionContextSequence'],
        '0x0556': ['ST', '1', 'AcquisitionContextDescription'],
        '0x059A': ['SQ', '1', 'SpecimenTypeCodeSequence'],
        '0x06FA': ['LO', '1', 'SlideIdentifier'],
        '0x071A': ['SQ', '1', 'ImageCenterPointCoordinatesSequence'],
        '0x072A': ['DS', '1', 'XOffsetInSlideCoordinateSystem'],
        '0x073A': ['DS', '1', 'YOffsetInSlideCoordinateSystem'],
        '0x074A': ['DS', '1', 'ZOffsetInSlideCoordinateSystem'],
        '0x08D8': ['SQ', '1', 'PixelSpacingSequence'],
        '0x08DA': ['SQ', '1', 'CoordinateSystemAxisCodeSequence'],
        '0x08EA': ['SQ', '1', 'MeasurementUnitsCodeSequence'],
        '0x1001': ['SH', '1', 'RequestedProcedureID'],
        '0x1002': ['LO', '1', 'ReasonForRequestedProcedure'],
        '0x1003': ['SH', '1', 'RequestedProcedurePriority'],
        '0x1004': ['LO', '1', 'PatientTransportArrangements'],
        '0x1005': ['LO', '1', 'RequestedProcedureLocation'],
        '0x1006': ['SH', '1', 'PlacerOrderNumberOfProcedure'],
        '0x1007': ['SH', '1', 'FillerOrderNumberOfProcedure'],
        '0x1008': ['LO', '1', 'ConfidentialityCode'],
        '0x1009': ['SH', '1', 'ReportingPriority'],
        '0x1010': ['PN', '1-n', 'NamesOfIntendedRecipientsOfResults'],
        '0x1400': ['LT', '1', 'RequestedProcedureComments'],
        '0x2001': ['LO', '1', 'ReasonForTheImagingServiceRequest'],
        '0x2002': ['LO', '1', 'ImagingServiceRequestDescription'],
        '0x2004': ['DA', '1', 'IssueDateOfImagingServiceRequest'],
        '0x2005': ['TM', '1', 'IssueTimeOfImagingServiceRequest'],
        '0x2006': ['SH', '1', 'PlacerOrderNumberOfImagingServiceRequest'],
        '0x2007': ['SH', '0', 'FillerOrderNumberOfImagingServiceRequest'],
        '0x2008': ['PN', '1', 'OrderEnteredBy'],
        '0x2009': ['SH', '1', 'OrderEntererLocation'],
        '0x2010': ['SH', '1', 'OrderCallbackPhoneNumber'],
        '0x2016': ['LO', '1', 'PlacerOrderNumberImagingServiceRequest'],
        '0x2017': ['LO', '1', 'FillerOrderNumberImagingServiceRequest'],
        '0x2400': ['LT', '1', 'ImagingServiceRequestComments'],
        '0x3001': ['LT', '1', 'ConfidentialityConstraint'],
        '0xA010': ['CS', '1', 'RelationshipType'],
        '0xA027': ['LO', '1', 'VerifyingOrganization'],
        '0xA030': ['DT', '1', 'VerificationDateTime'],
        '0xA032': ['DT', '1', 'ObservationDateTime'],
        '0xA040': ['CS', '1', 'ValueType'],
        '0xA043': ['SQ', '1', 'ConceptNameCodeSequence'],
        '0xA050': ['CS', '1', 'ContinuityOfContent'],
        '0xA073': ['SQ', '1', 'VerifyingObserverSequence'],
        '0xA075': ['PN', '1', 'VerifyingObserverName'],
        '0xA088': ['SQ', '1', 'VerifyingObserverIdentificationCodeSeque'],
        '0xA0B0': ['US', '2-2n', 'ReferencedWaveformChannels'],
        '0xA120': ['DT', '1', 'DateTime'],
        '0xA121': ['DA', '1', 'Date'],
        '0xA122': ['TM', '1', 'Time'],
        '0xA123': ['PN', '1', 'PersonName'],
        '0xA124': ['UI', '1', 'UID'],
        '0xA130': ['CS', '1', 'TemporalRangeType'],
        '0xA132': ['UL', '1-n', 'ReferencedSamplePositionsU'],
        '0xA136': ['US', '1-n', 'ReferencedFrameNumbers'],
        '0xA138': ['DS', '1-n', 'ReferencedTimeOffsets'],
        '0xA13A': ['DT', '1-n', 'ReferencedDatetime'],
        '0xA160': ['UT', '1', 'TextValue'],
        '0xA168': ['SQ', '1', 'ConceptCodeSequence'],
        '0xA180': ['US', '1', 'AnnotationGroupNumber'],
        '0xA195': ['SQ', '1', 'ConceptNameCodeSequenceModifier'],
        '0xA300': ['SQ', '1', 'MeasuredValueSequence'],
        '0xA30A': ['DS', '1-n', 'NumericValue'],
        '0xA360': ['SQ', '1', 'PredecessorDocumentsSequence'],
        '0xA370': ['SQ', '1', 'ReferencedRequestSequence'],
        '0xA372': ['SQ', '1', 'PerformedProcedureCodeSequence'],
        '0xA375': ['SQ', '1', 'CurrentRequestedProcedureEvidenceSequenSequence'],
        '0xA385': ['SQ', '1', 'PertinentOtherEvidenceSequence'],
        '0xA491': ['CS', '1', 'CompletionFlag'],
        '0xA492': ['LO', '1', 'CompletionFlagDescription'],
        '0xA493': ['CS', '1', 'VerificationFlag'],
        '0xA504': ['SQ', '1', 'ContentTemplateSequence'],
        '0xA525': ['SQ', '1', 'IdenticalDocumentsSequence'],
        '0xA730': ['SQ', '1', 'ContentSequence'],
        '0xB020': ['SQ', '1', 'AnnotationSequence'],
        '0xDB00': ['CS', '1', 'TemplateIdentifier'],
        '0xDB06': ['DT', '1', 'TemplateVersion'],
        '0xDB07': ['DT', '1', 'TemplateLocalVersion'],
        '0xDB0B': ['CS', '1', 'TemplateExtensionFlag'],
        '0xDB0C': ['UI', '1', 'TemplateExtensionOrganizationUID'],
        '0xDB0D': ['UI', '1', 'TemplateExtensionCreatorUID'],
        '0xDB73': ['UL', '1-n', 'ReferencedContentItemIdentifier'],
    },
    '0x0050': {
        '0x0000': ['UL', '1', 'XRayAngioDeviceGroupLength'],
        '0x0004': ['CS', '1', 'CalibrationObject'],
        '0x0010': ['SQ', '1', 'DeviceSequence'],
        '0x0012': ['CS', '1', 'DeviceType'],
        '0x0014': ['DS', '1', 'DeviceLength'],
        '0x0016': ['DS', '1', 'DeviceDiameter'],
        '0x0017': ['CS', '1', 'DeviceDiameterUnits'],
        '0x0018': ['DS', '1', 'DeviceVolume'],
        '0x0019': ['DS', '1', 'InterMarkerDistance'],
        '0x0020': ['LO', '1', 'DeviceDescription'],
        '0x0030': ['SQ', '1', 'CodedInterventionalDeviceSequence'],
    },
    '0x0054': {
        '0x0000': ['UL', '1', 'NuclearMedicineGroupLength'],
        '0x0010': ['US', '1-n', 'EnergyWindowVector'],
        '0x0011': ['US', '1', 'NumberOfEnergyWindows'],
        '0x0012': ['SQ', '1', 'EnergyWindowInformationSequence'],
        '0x0013': ['SQ', '1', 'EnergyWindowRangeSequence'],
        '0x0014': ['DS', '1', 'EnergyWindowLowerLimit'],
        '0x0015': ['DS', '1', 'EnergyWindowUpperLimit'],
        '0x0016': ['SQ', '1', 'RadiopharmaceuticalInformationSequence'],
        '0x0017': ['IS', '1', 'ResidualSyringeCounts'],
        '0x0018': ['SH', '1', 'EnergyWindowName'],
        '0x0020': ['US', '1-n', 'DetectorVector'],
        '0x0021': ['US', '1', 'NumberOfDetectors'],
        '0x0022': ['SQ', '1', 'DetectorInformationSequence'],
        '0x0030': ['US', '1-n', 'PhaseVector'],
        '0x0031': ['US', '1', 'NumberOfPhases'],
        '0x0032': ['SQ', '1', 'PhaseInformationSequence'],
        '0x0033': ['US', '1', 'NumberOfFramesInPhase'],
        '0x0036': ['IS', '1', 'PhaseDelay'],
        '0x0038': ['IS', '1', 'PauseBetweenFrames'],
        '0x0050': ['US', '1-n', 'RotationVector'],
        '0x0051': ['US', '1', 'NumberOfRotations'],
        '0x0052': ['SQ', '1', 'RotationInformationSequence'],
        '0x0053': ['US', '1', 'NumberOfFramesInRotation'],
        '0x0060': ['US', '1-n', 'RRIntervalVector'],
        '0x0061': ['US', '1', 'NumberOfRRIntervals'],
        '0x0062': ['SQ', '1', 'GatedInformationSequence'],
        '0x0063': ['SQ', '1', 'DataInformationSequence'],
        '0x0070': ['US', '1-n', 'TimeSlotVector'],
        '0x0071': ['US', '1', 'NumberOfTimeSlots'],
        '0x0072': ['SQ', '1', 'TimeSlotInformationSequence'],
        '0x0073': ['DS', '1', 'TimeSlotTime'],
        '0x0080': ['US', '1-n', 'SliceVector'],
        '0x0081': ['US', '1', 'NumberOfSlices'],
        '0x0090': ['US', '1-n', 'AngularViewVector'],
        '0x0100': ['US', '1-n', 'TimeSliceVector'],
        '0x0101': ['US', '1', 'NumberOfTimeSlices'],
        '0x0200': ['DS', '1', 'StartAngle'],
        '0x0202': ['CS', '1', 'TypeOfDetectorMotion'],
        '0x0210': ['IS', '1-n', 'TriggerVector'],
        '0x0211': ['US', '1', 'NumberOfTriggersInPhase'],
        '0x0220': ['SQ', '1', 'ViewCodeSequence'],
        '0x0222': ['SQ', '1', 'ViewAngulationModifierCodeSequence'],
        '0x0300': ['SQ', '1', 'RadionuclideCodeSequence'],
        '0x0302': ['SQ', '1', 'AdministrationRouteCodeSequence'],
        '0x0304': ['SQ', '1', 'RadiopharmaceuticalCodeSequence'],
        '0x0306': ['SQ', '1', 'CalibrationDataSequence'],
        '0x0308': ['US', '1', 'EnergyWindowNumber'],
        '0x0400': ['SH', '1', 'ImageID'],
        '0x0410': ['SQ', '1', 'PatientOrientationCodeSequence'],
        '0x0412': ['SQ', '1', 'PatientOrientationModifierCodeSequence'],
        '0x0414': ['SQ', '1', 'PatientGantryRelationshipCodeSequence'],
        '0x1000': ['CS', '2', 'SeriesType'],
        '0x1001': ['CS', '1', 'Units'],
        '0x1002': ['CS', '1', 'CountsSource'],
        '0x1004': ['CS', '1', 'ReprojectionMethod'],
        '0x1100': ['CS', '1', 'RandomsCorrectionMethod'],
        '0x1101': ['LO', '1', 'AttenuationCorrectionMethod'],
        '0x1102': ['CS', '1', 'DecayCorrection'],
        '0x1103': ['LO', '1', 'ReconstructionMethod'],
        '0x1104': ['LO', '1', 'DetectorLinesOfResponseUsed'],
        '0x1105': ['LO', '1', 'ScatterCorrectionMethod'],
        '0x1200': ['DS', '1', 'AxialAcceptance'],
        '0x1201': ['IS', '2', 'AxialMash'],
        '0x1202': ['IS', '1', 'TransverseMash'],
        '0x1203': ['DS', '2', 'DetectorElementSize'],
        '0x1210': ['DS', '1', 'CoincidenceWindowWidth'],
        '0x1220': ['CS', '1-n', 'SecondaryCountsType'],
        '0x1300': ['DS', '1', 'FrameReferenceTime'],
        '0x1310': ['IS', '1', 'PrimaryPromptsCountsAccumulated'],
        '0x1311': ['IS', '1-n', 'SecondaryCountsAccumulated'],
        '0x1320': ['DS', '1', 'SliceSensitivityFactor'],
        '0x1321': ['DS', '1', 'DecayFactor'],
        '0x1322': ['DS', '1', 'DoseCalibrationFactor'],
        '0x1323': ['DS', '1', 'ScatterFractionFactor'],
        '0x1324': ['DS', '1', 'DeadTimeFactor'],
        '0x1330': ['US', '1', 'ImageIndex'],
        '0x1400': ['CS', '1-n', 'CountsIncluded'],
        '0x1401': ['CS', '1', 'DeadTimeCorrectionFlag'],
    },
    '0x0060': {
        '0x0000': ['UL', '1', 'HistogramGroupLength'],
        '0x3000': ['SQ', '1', 'HistogramSequence'],
        '0x3002': ['US', '1', 'HistogramNumberofBins'],
        '0x3004': ['US/SS', '1', 'HistogramFirstBinValue'],
        '0x3006': ['US/SS', '1', 'HistogramLastBinValue'],
        '0x3008': ['US', '1', 'HistogramBinWidth'],
        '0x3010': ['LO', '1', 'HistogramExplanation'],
        '0x3020': ['UL', '1-n', 'HistogramData'],
    },
    '0x0070': {
        '0x0001': ['SQ', '1', 'GraphicAnnotationSequence'],
        '0x0002': ['CS', '1', 'GraphicLayer'],
        '0x0003': ['CS', '1', 'BoundingBoxAnnotationUnits'],
        '0x0004': ['CS', '1', 'AnchorPointAnnotationUnits'],
        '0x0005': ['CS', '1', 'GraphicAnnotationUnits'],
        '0x0006': ['ST', '1', 'UnformattedTextValue'],
        '0x0008': ['SQ', '1', 'TextObjectSequence'],
        '0x0009': ['SQ', '1', 'GraphicObjectSequence'],
        '0x0010': ['FL', '2', 'BoundingBoxTopLeftHandCorner'],
        '0x0011': ['FL', '2', 'BoundingBoxBottomRightHandCorner'],
        '0x0012': ['CS', '1', 'BoundingBoxTextHorizontalJustification'],
        '0x0014': ['FL', '2', 'AnchorPoint'],
        '0x0015': ['CS', '1', 'AnchorPointVisibility'],
        '0x0020': ['US', '1', 'GraphicDimensions'],
        '0x0021': ['US', '1', 'NumberOfGraphicPoints'],
        '0x0022': ['FL', '2-n', 'GraphicData'],
        '0x0023': ['CS', '1', 'GraphicType'],
        '0x0024': ['CS', '1', 'GraphicFilled'],
        '0x0040': ['IS', '1', 'ImageRotationFrozenDraftRetired'],
        '0x0041': ['CS', '1', 'ImageHorizontalFlip'],
        '0x0042': ['US', '1', 'ImageRotation'],
        '0x0050': ['US', '2', 'DisplayedAreaTLHCFrozenDraftRetired'],
        '0x0051': ['US', '2', 'DisplayedAreaBRHCFrozenDraftRetired'],
        '0x0052': ['SL', '2', 'DisplayedAreaTopLeftHandCorner'],
        '0x0053': ['SL', '2', 'DisplayedAreaBottomRightHandCorner'],
        '0x005A': ['SQ', '1', 'DisplayedAreaSelectionSequence'],
        '0x0060': ['SQ', '1', 'GraphicLayerSequence'],
        '0x0062': ['IS', '1', 'GraphicLayerOrder'],
        '0x0066': ['US', '1', 'GraphicLayerRecommendedDisplayGrayscaleValue'],
        '0x0067': ['US', '3', 'GraphicLayerRecommendedDisplayRGBValue'],
        '0x0068': ['LO', '1', 'GraphicLayerDescription'],
        '0x0080': ['CS', '1', 'PresentationLabel'],
        '0x0081': ['LO', '1', 'PresentationDescription'],
        '0x0082': ['DA', '1', 'PresentationCreationDate'],
        '0x0083': ['TM', '1', 'PresentationCreationTime'],
        '0x0084': ['PN', '1', 'PresentationCreatorsName'],
        '0x0100': ['CS', '1', 'PresentationSizeMode'],
        '0x0101': ['DS', '2', 'PresentationPixelSpacing'],
        '0x0102': ['IS', '2', 'PresentationPixelAspectRatio'],
        '0x0103': ['FL', '1', 'PresentationPixelMagnificationRatio'],
    },
    '0x0088': {
        '0x0000': ['UL', '1', 'StorageGroupLength'],
        '0x0130': ['SH', '1', 'StorageMediaFilesetID'],
        '0x0140': ['UI', '1', 'StorageMediaFilesetUID'],
        '0x0200': ['SQ', '1', 'IconImage'],
        '0x0904': ['LO', '1', 'TopicTitle'],
        '0x0906': ['ST', '1', 'TopicSubject'],
        '0x0910': ['LO', '1', 'TopicAuthor'],
        '0x0912': ['LO', '3', 'TopicKeyWords'],
    },
    '0x1000': {
        '0x0000': ['UL', '1', 'CodeTableGroupLength'],
        '0x0010': ['US', '3', 'EscapeTriplet'],
        '0x0011': ['US', '3', 'RunLengthTriplet'],
        '0x0012': ['US', '1', 'HuffmanTableSize'],
        '0x0013': ['US', '3', 'HuffmanTableTriplet'],
        '0x0014': ['US', '1', 'ShiftTableSize'],
        '0x0015': ['US', '3', 'ShiftTableTriplet'],
    },
    '0x1010': {
        '0x0000': ['UL', '1', 'ZonalMapGroupLength'],
        '0x0004': ['US', '1-n', 'ZonalMap'],
    },
    '0x2000': {
        '0x0000': ['UL', '1', 'FilmSessionGroupLength'],
        '0x0010': ['IS', '1', 'NumberOfCopies'],
        '0x001E': ['SQ', '1', 'PrinterConfigurationSequence'],
        '0x0020': ['CS', '1', 'PrintPriority'],
        '0x0030': ['CS', '1', 'MediumType'],
        '0x0040': ['CS', '1', 'FilmDestination'],
        '0x0050': ['LO', '1', 'FilmSessionLabel'],
        '0x0060': ['IS', '1', 'MemoryAllocation'],
        '0x0061': ['IS', '1', 'MaximumMemoryAllocation'],
        '0x0062': ['CS', '1', 'ColorImagePrintingFlag'],
        '0x0063': ['CS', '1', 'CollationFlag'],
        '0x0065': ['CS', '1', 'AnnotationFlag'],
        '0x0067': ['CS', '1', 'ImageOverlayFlag'],
        '0x0069': ['CS', '1', 'PresentationLUTFlag'],
        '0x006A': ['CS', '1', 'ImageBoxPresentationLUTFlag'],
        '0x00A0': ['US', '1', 'MemoryBitDepth'],
        '0x00A1': ['US', '1', 'PrintingBitDepth'],
        '0x00A2': ['SQ', '1', 'MediaInstalledSequence'],
        '0x00A4': ['SQ', '1', 'OtherMediaAvailableSequence'],
        '0x00A8': ['SQ', '1', 'SupportedImageDisplayFormatsSequence'],
        '0x0500': ['SQ', '1', 'ReferencedFilmBoxSequence'],
        '0x0510': ['SQ', '1', 'ReferencedStoredPrintSequence'],
    },
    '0x2010': {
        '0x0000': ['UL', '1', 'FilmBoxGroupLength'],
        '0x0010': ['ST', '1', 'ImageDisplayFormat'],
        '0x0030': ['CS', '1', 'AnnotationDisplayFormatID'],
        '0x0040': ['CS', '1', 'FilmOrientation'],
        '0x0050': ['CS', '1', 'FilmSizeID'],
        '0x0052': ['CS', '1', 'PrinterResolutionID'],
        '0x0054': ['CS', '1', 'DefaultPrinterResolutionID'],
        '0x0060': ['CS', '1', 'MagnificationType'],
        '0x0080': ['CS', '1', 'SmoothingType'],
        '0x00A6': ['CS', '1', 'DefaultMagnificationType'],
        '0x00A7': ['CS', '1-n', 'OtherMagnificationTypesAvailable'],
        '0x00A8': ['CS', '1', 'DefaultSmoothingType'],
        '0x00A9': ['CS', '1-n', 'OtherSmoothingTypesAvailable'],
        '0x0100': ['CS', '1', 'BorderDensity'],
        '0x0110': ['CS', '1', 'EmptyImageDensity'],
        '0x0120': ['US', '1', 'MinDensity'],
        '0x0130': ['US', '1', 'MaxDensity'],
        '0x0140': ['CS', '1', 'Trim'],
        '0x0150': ['ST', '1', 'ConfigurationInformation'],
        '0x0152': ['LT', '1', 'ConfigurationInformationDescription'],
        '0x0154': ['IS', '1', 'MaximumCollatedFilms'],
        '0x015E': ['US', '1', 'Illumination'],
        '0x0160': ['US', '1', 'ReflectedAmbientLight'],
        '0x0376': ['DS', '2', 'PrinterPixelSpacing'],
        '0x0500': ['SQ', '1', 'ReferencedFilmSessionSequence'],
        '0x0510': ['SQ', '1', 'ReferencedImageBoxSequence'],
        '0x0520': ['SQ', '1', 'ReferencedBasicAnnotationBoxSequence'],
    },
    '0x2020': {
        '0x0000': ['UL', '1', 'ImageBoxGroupLength'],
        '0x0010': ['US', '1', 'ImageBoxPosition'],
        '0x0020': ['CS', '1', 'Polarity'],
        '0x0030': ['DS', '1', 'RequestedImageSize'],
        '0x0040': ['CS', '1', 'RequestedDecimateCropBehavior'],
        '0x0050': ['CS', '1', 'RequestedResolutionID'],
        '0x00A0': ['CS', '1', 'RequestedImageSizeFlag'],
        '0x00A2': ['CS', '1', 'DecimateCropResult'],
        '0x0110': ['SQ', '1', 'PreformattedGrayscaleImageSequence'],
        '0x0111': ['SQ', '1', 'PreformattedColorImageSequence'],
        '0x0130': ['SQ', '1', 'ReferencedImageOverlayBoxSequence'],
        '0x0140': ['SQ', '1', 'ReferencedVOILUTBoxSequence'],
    },
    '0x2030': {
        '0x0000': ['UL', '1', 'AnnotationGroupLength'],
        '0x0010': ['US', '1', 'AnnotationPosition'],
        '0x0020': ['LO', '1', 'TextString'],
    },
    '0x2040': {
        '0x0000': ['UL', '1', 'OverlayBoxGroupLength'],
        '0x0010': ['SQ', '1', 'ReferencedOverlayPlaneSequence'],
        '0x0011': ['US', '9', 'ReferencedOverlayPlaneGroups'],
        '0x0020': ['SQ', '1', 'OverlayPixelDataSequence'],
        '0x0060': ['CS', '1', 'OverlayMagnificationType'],
        '0x0070': ['CS', '1', 'OverlaySmoothingType'],
        '0x0072': ['CS', '1', 'OverlayOrImageMagnification'],
        '0x0074': ['US', '1', 'MagnifyToNumberOfColumns'],
        '0x0080': ['CS', '1', 'OverlayForegroundDensity'],
        '0x0082': ['CS', '1', 'OverlayBackgroundDensity'],
        '0x0090': ['CS', '1', 'OverlayMode'],
        '0x0100': ['CS', '1', 'ThresholdDensity'],
        '0x0500': ['SQ', '1', 'ReferencedOverlayImageBoxSequence'],
    },
    '0x2050': {
        '0x0000': ['UL', '1', 'PresentationLUTGroupLength'],
        '0x0010': ['SQ', '1', 'PresentationLUTSequence'],
        '0x0020': ['CS', '1', 'PresentationLUTShape'],
        '0x0500': ['SQ', '1', 'ReferencedPresentationLUTSequence'],
    },
    '0x2100': {
        '0x0000': ['UL', '1', 'PrintJobGroupLength'],
        '0x0010': ['SH', '1', 'PrintJobID'],
        '0x0020': ['CS', '1', 'ExecutionStatus'],
        '0x0030': ['CS', '1', 'ExecutionStatusInfo'],
        '0x0040': ['DA', '1', 'CreationDate'],
        '0x0050': ['TM', '1', 'CreationTime'],
        '0x0070': ['AE', '1', 'Originator'],
        '0x0140': ['AE', '1', 'DestinationAE'],
        '0x0160': ['SH', '1', 'OwnerID'],
        '0x0170': ['IS', '1', 'NumberOfFilms'],
        '0x0500': ['SQ', '1', 'ReferencedPrintJobSequence'],
    },
    '0x2110': {
        '0x0000': ['UL', '1', 'PrinterGroupLength'],
        '0x0010': ['CS', '1', 'PrinterStatus'],
        '0x0020': ['CS', '1', 'PrinterStatusInfo'],
        '0x0030': ['LO', '1', 'PrinterName'],
        '0x0099': ['SH', '1', 'PrintQueueID'],
    },
    '0x2120': {
        '0x0000': ['UL', '1', 'QueueGroupLength'],
        '0x0010': ['CS', '1', 'QueueStatus'],
        '0x0050': ['SQ', '1', 'PrintJobDescriptionSequence'],
        '0x0070': ['SQ', '1', 'QueueReferencedPrintJobSequence'],
    },
    '0x2130': {
        '0x0000': ['UL', '1', 'PrintContentGroupLength'],
        '0x0010': ['SQ', '1', 'PrintManagementCapabilitiesSequence'],
        '0x0015': ['SQ', '1', 'PrinterCharacteristicsSequence'],
        '0x0030': ['SQ', '1', 'FilmBoxContentSequence'],
        '0x0040': ['SQ', '1', 'ImageBoxContentSequence'],
        '0x0050': ['SQ', '1', 'AnnotationContentSequence'],
        '0x0060': ['SQ', '1', 'ImageOverlayBoxContentSequence'],
        '0x0080': ['SQ', '1', 'PresentationLUTContentSequence'],
        '0x00A0': ['SQ', '1', 'ProposedStudySequence'],
        '0x00C0': ['SQ', '1', 'OriginalImageSequence'],
    },
    '0x3002': {
        '0x0000': ['UL', '1', 'RTImageGroupLength'],
        '0x0002': ['SH', '1', 'RTImageLabel'],
        '0x0003': ['LO', '1', 'RTImageName'],
        '0x0004': ['ST', '1', 'RTImageDescription'],
        '0x000A': ['CS', '1', 'ReportedValuesOrigin'],
        '0x000C': ['CS', '1', 'RTImagePlane'],
        '0x000D': ['DS', '3', 'XRayImageReceptorTranslation'],
        '0x000E': ['DS', '1', 'XRayImageReceptorAngle'],
        '0x0010': ['DS', '6', 'RTImageOrientation'],
        '0x0011': ['DS', '2', 'ImagePlanePixelSpacing'],
        '0x0012': ['DS', '2', 'RTImagePosition'],
        '0x0020': ['SH', '1', 'RadiationMachineName'],
        '0x0022': ['DS', '1', 'RadiationMachineSAD'],
        '0x0024': ['DS', '1', 'RadiationMachineSSD'],
        '0x0026': ['DS', '1', 'RTImageSID'],
        '0x0028': ['DS', '1', 'SourceToReferenceObjectDistance'],
        '0x0029': ['IS', '1', 'FractionNumber'],
        '0x0030': ['SQ', '1', 'ExposureSequence'],
        '0x0032': ['DS', '1', 'MetersetExposure'],
        '0x0034': ['DS', '4', 'DiaphragmPosition'],
    },
    '0x3004': {
        '0x0000': ['UL', '1', 'RTDoseGroupLength'],
        '0x0001': ['CS', '1', 'DVHType'],
        '0x0002': ['CS', '1', 'DoseUnits'],
        '0x0004': ['CS', '1', 'DoseType'],
        '0x0006': ['LO', '1', 'DoseComment'],
        '0x0008': ['DS', '3', 'NormalizationPoint'],
        '0x000A': ['CS', '1', 'DoseSummationType'],
        '0x000C': ['DS', '2-n', 'GridFrameOffsetVector'],
        '0x000E': ['DS', '1', 'DoseGridScaling'],
        '0x0010': ['SQ', '1', 'RTDoseROISequence'],
        '0x0012': ['DS', '1', 'DoseValue'],
        '0x0040': ['DS', '3', 'DVHNormalizationPoint'],
        '0x0042': ['DS', '1', 'DVHNormalizationDoseValue'],
        '0x0050': ['SQ', '1', 'DVHSequence'],
        '0x0052': ['DS', '1', 'DVHDoseScaling'],
        '0x0054': ['CS', '1', 'DVHVolumeUnits'],
        '0x0056': ['IS', '1', 'DVHNumberOfBins'],
        '0x0058': ['DS', '2-2n', 'DVHData'],
        '0x0060': ['SQ', '1', 'DVHReferencedROISequence'],
        '0x0062': ['CS', '1', 'DVHROIContributionType'],
        '0x0070': ['DS', '1', 'DVHMinimumDose'],
        '0x0072': ['DS', '1', 'DVHMaximumDose'],
        '0x0074': ['DS', '1', 'DVHMeanDose'],
    },
    '0x3006': {
        '0x0000': ['UL', '1', 'RTStructureSetGroupLength'],
        '0x0002': ['SH', '1', 'StructureSetLabel'],
        '0x0004': ['LO', '1', 'StructureSetName'],
        '0x0006': ['ST', '1', 'StructureSetDescription'],
        '0x0008': ['DA', '1', 'StructureSetDate'],
        '0x0009': ['TM', '1', 'StructureSetTime'],
        '0x0010': ['SQ', '1', 'ReferencedFrameOfReferenceSequence'],
        '0x0012': ['SQ', '1', 'RTReferencedStudySequence'],
        '0x0014': ['SQ', '1', 'RTReferencedSeriesSequence'],
        '0x0016': ['SQ', '1', 'ContourImageSequence'],
        '0x0020': ['SQ', '1', 'StructureSetROISequence'],
        '0x0022': ['IS', '1', 'ROINumber'],
        '0x0024': ['UI', '1', 'ReferencedFrameOfReferenceUID'],
        '0x0026': ['LO', '1', 'ROIName'],
        '0x0028': ['ST', '1', 'ROIDescription'],
        '0x002A': ['IS', '3', 'ROIDisplayColor'],
        '0x002C': ['DS', '1', 'ROIVolume'],
        '0x0030': ['SQ', '1', 'RTRelatedROISequence'],
        '0x0033': ['CS', '1', 'RTROIRelationship'],
        '0x0036': ['CS', '1', 'ROIGenerationAlgorithm'],
        '0x0038': ['LO', '1', 'ROIGenerationDescription'],
        '0x0039': ['SQ', '1', 'ROIContourSequence'],
        '0x0040': ['SQ', '1', 'ContourSequence'],
        '0x0042': ['CS', '1', 'ContourGeometricType'],
        '0x0044': ['DS', '1', 'ContourSlabThickness'],
        '0x0045': ['DS', '3', 'ContourOffsetVector'],
        '0x0046': ['IS', '1', 'NumberOfContourPoints'],
        '0x0048': ['IS', '1', 'ContourNumber'],
        '0x0049': ['IS', '1-n', 'AttachedContours'],
        '0x0050': ['DS', '3-3n', 'ContourData'],
        '0x0080': ['SQ', '1', 'RTROIObservationsSequence'],
        '0x0082': ['IS', '1', 'ObservationNumber'],
        '0x0084': ['IS', '1', 'ReferencedROINumber'],
        '0x0085': ['SH', '1', 'ROIObservationLabel'],
        '0x0086': ['SQ', '1', 'RTROIIdentificationCodeSequence'],
        '0x0088': ['ST', '1', 'ROIObservationDescription'],
        '0x00A0': ['SQ', '1', 'RelatedRTROIObservationsSequence'],
        '0x00A4': ['CS', '1', 'RTROIInterpretedType'],
        '0x00A6': ['PN', '1', 'ROIInterpreter'],
        '0x00B0': ['SQ', '1', 'ROIPhysicalPropertiesSequence'],
        '0x00B2': ['CS', '1', 'ROIPhysicalProperty'],
        '0x00B4': ['DS', '1', 'ROIPhysicalPropertyValue'],
        '0x00C0': ['SQ', '1', 'FrameOfReferenceRelationshipSequence'],
        '0x00C2': ['UI', '1', 'RelatedFrameOfReferenceUID'],
        '0x00C4': ['CS', '1', 'FrameOfReferenceTransformationType'],
        '0x00C6': ['DS', '16', 'FrameOfReferenceTransformationMatrix'],
        '0x00C8': ['LO', '1', 'FrameOfReferenceTransformationComment'],
    },
    '0x3008': {
        '0x0010': ['SQ', '1', 'MeasuredDoseReferenceSequence'],
        '0x0012': ['ST', '1', 'MeasuredDoseDescription'],
        '0x0014': ['CS', '1', 'MeasuredDoseType'],
        '0x0016': ['DS', '1', 'MeasuredDoseValue'],
        '0x0020': ['SQ', '1', 'TreatmentSessionBeamSequence'],
        '0x0022': ['IS', '1', 'CurrentFractionNumber'],
        '0x0024': ['DA', '1', 'TreatmentControlPointDate'],
        '0x0025': ['TM', '1', 'TreatmentControlPointTime'],
        '0x002A': ['CS', '1', 'TreatmentTerminationStatus'],
        '0x002B': ['SH', '1', 'TreatmentTerminationCode'],
        '0x002C': ['CS', '1', 'TreatmentVerificationStatus'],
        '0x0030': ['SQ', '1', 'ReferencedTreatmentRecordSequence'],
        '0x0032': ['DS', '1', 'SpecifiedPrimaryMeterset'],
        '0x0033': ['DS', '1', 'SpecifiedSecondaryMeterset'],
        '0x0036': ['DS', '1', 'DeliveredPrimaryMeterset'],
        '0x0037': ['DS', '1', 'DeliveredSecondaryMeterset'],
        '0x003A': ['DS', '1', 'SpecifiedTreatmentTime'],
        '0x003B': ['DS', '1', 'DeliveredTreatmentTime'],
        '0x0040': ['SQ', '1', 'ControlPointDeliverySequence'],
        '0x0042': ['DS', '1', 'SpecifiedMeterset'],
        '0x0044': ['DS', '1', 'DeliveredMeterset'],
        '0x0048': ['DS', '1', 'DoseRateDelivered'],
        '0x0050': ['SQ', '1', 'TreatmentSummaryCalculatedDoseReferenceSequence'],
        '0x0052': ['DS', '1', 'CumulativeDosetoDoseReference'],
        '0x0054': ['DA', '1', 'FirstTreatmentDate'],
        '0x0056': ['DA', '1', 'MostRecentTreatmentDate'],
        '0x005A': ['IS', '1', 'NumberofFractionsDelivered'],
        '0x0060': ['SQ', '1', 'OverrideSequence'],
        '0x0062': ['AT', '1', 'OverrideParameterPointer'],
        '0x0064': ['IS', '1', 'MeasuredDoseReferenceNumber'],
        '0x0066': ['ST', '1', 'OverrideReason'],
        '0x0070': ['SQ', '1', 'CalculatedDoseReferenceSequence'],
        '0x0072': ['IS', '1', 'CalculatedDoseReferenceNumber'],
        '0x0074': ['ST', '1', 'CalculatedDoseReferenceDescription'],
        '0x0076': ['DS', '1', 'CalculatedDoseReferenceDoseValue'],
        '0x0078': ['DS', '1', 'StartMeterset'],
        '0x007A': ['DS', '1', 'EndMeterset'],
        '0x0080': ['SQ', '1', 'ReferencedMeasuredDoseReferenceSequence'],
        '0x0082': ['IS', '1', 'ReferencedMeasuredDoseReferenceNumber'],
        '0x0090': ['SQ', '1', 'ReferencedCalculatedDoseReferenceSequence'],
        '0x0092': ['IS', '1', 'ReferencedCalculatedDoseReferenceNumber'],
        '0x00A0': ['SQ', '1', 'BeamLimitingDeviceLeafPairsSequence'],
        '0x00B0': ['SQ', '1', 'RecordedWedgeSequence'],
        '0x00C0': ['SQ', '1', 'RecordedCompensatorSequence'],
        '0x00D0': ['SQ', '1', 'RecordedBlockSequence'],
        '0x00E0': ['SQ', '1', 'TreatmentSummaryMeasuredDoseReferenceSequence'],
        '0x0100': ['SQ', '1', 'RecordedSourceSequence'],
        '0x0105': ['LO', '1', 'SourceSerialNumber'],
        '0x0110': ['SQ', '1', 'TreatmentSessionApplicationSetupSequence'],
        '0x0116': ['CS', '1', 'ApplicationSetupCheck'],
        '0x0120': ['SQ', '1', 'RecordedBrachyAccessoryDeviceSequence'],
        '0x0122': ['IS', '1', 'ReferencedBrachyAccessoryDeviceNumber'],
        '0x0130': ['SQ', '1', 'RecordedChannelSequence'],
        '0x0132': ['DS', '1', 'SpecifiedChannelTotalTime'],
        '0x0134': ['DS', '1', 'DeliveredChannelTotalTime'],
        '0x0136': ['IS', '1', 'SpecifiedNumberofPulses'],
        '0x0138': ['IS', '1', 'DeliveredNumberofPulses'],
        '0x013A': ['DS', '1', 'SpecifiedPulseRepetitionInterval'],
        '0x013C': ['DS', '1', 'DeliveredPulseRepetitionInterval'],
        '0x0140': ['SQ', '1', 'RecordedSourceApplicatorSequence'],
        '0x0142': ['IS', '1', 'ReferencedSourceApplicatorNumber'],
        '0x0150': ['SQ', '1', 'RecordedChannelShieldSequence'],
        '0x0152': ['IS', '1', 'ReferencedChannelShieldNumber'],
        '0x0160': ['SQ', '1', 'BrachyControlPointDeliveredSequence'],
        '0x0162': ['DA', '1', 'SafePositionExitDate'],
        '0x0164': ['TM', '1', 'SafePositionExitTime'],
        '0x0166': ['DA', '1', 'SafePositionReturnDate'],
        '0x0168': ['TM', '1', 'SafePositionReturnTime'],
        '0x0200': ['CS', '1', 'CurrentTreatmentStatus'],
        '0x0202': ['ST', '1', 'TreatmentStatusComment'],
        '0x0220': ['SQ', '1', 'FractionGroupSummarySequence'],
        '0x0223': ['IS', '1', 'ReferencedFractionNumber'],
        '0x0224': ['CS', '1', 'FractionGroupType'],
        '0x0230': ['CS', '1', 'BeamStopperPosition'],
        '0x0240': ['SQ', '1', 'FractionStatusSummarySequence'],
        '0x0250': ['DA', '1', 'TreatmentDate'],
        '0x0251': ['TM', '1', 'TreatmentTime'],
    },
    '0x300A': {
        '0x0000': ['UL', '1', 'RTPlanGroupLength'],
        '0x0002': ['SH', '1', 'RTPlanLabel'],
        '0x0003': ['LO', '1', 'RTPlanName'],
        '0x0004': ['ST', '1', 'RTPlanDescription'],
        '0x0006': ['DA', '1', 'RTPlanDate'],
        '0x0007': ['TM', '1', 'RTPlanTime'],
        '0x0009': ['LO', '1-n', 'TreatmentProtocols'],
        '0x000A': ['CS', '1', 'TreatmentIntent'],
        '0x000B': ['LO', '1-n', 'TreatmentSites'],
        '0x000C': ['CS', '1', 'RTPlanGeometry'],
        '0x000E': ['ST', '1', 'PrescriptionDescription'],
        '0x0010': ['SQ', '1', 'DoseReferenceSequence'],
        '0x0012': ['IS', '1', 'DoseReferenceNumber'],
        '0x0014': ['CS', '1', 'DoseReferenceStructureType'],
        '0x0015': ['CS', '1', 'NominalBeamEnergyUnit'],
        '0x0016': ['LO', '1', 'DoseReferenceDescription'],
        '0x0018': ['DS', '3', 'DoseReferencePointCoordinates'],
        '0x001A': ['DS', '1', 'NominalPriorDose'],
        '0x0020': ['CS', '1', 'DoseReferenceType'],
        '0x0021': ['DS', '1', 'ConstraintWeight'],
        '0x0022': ['DS', '1', 'DeliveryWarningDose'],
        '0x0023': ['DS', '1', 'DeliveryMaximumDose'],
        '0x0025': ['DS', '1', 'TargetMinimumDose'],
        '0x0026': ['DS', '1', 'TargetPrescriptionDose'],
        '0x0027': ['DS', '1', 'TargetMaximumDose'],
        '0x0028': ['DS', '1', 'TargetUnderdoseVolumeFraction'],
        '0x002A': ['DS', '1', 'OrganAtRiskFullVolumeDose'],
        '0x002B': ['DS', '1', 'OrganAtRiskLimitDose'],
        '0x002C': ['DS', '1', 'OrganAtRiskMaximumDose'],
        '0x002D': ['DS', '1', 'OrganAtRiskOverdoseVolumeFraction'],
        '0x0040': ['SQ', '1', 'ToleranceTableSequence'],
        '0x0042': ['IS', '1', 'ToleranceTableNumber'],
        '0x0043': ['SH', '1', 'ToleranceTableLabel'],
        '0x0044': ['DS', '1', 'GantryAngleTolerance'],
        '0x0046': ['DS', '1', 'BeamLimitingDeviceAngleTolerance'],
        '0x0048': ['SQ', '1', 'BeamLimitingDeviceToleranceSequence'],
        '0x004A': ['DS', '1', 'BeamLimitingDevicePositionTolerance'],
        '0x004C': ['DS', '1', 'PatientSupportAngleTolerance'],
        '0x004E': ['DS', '1', 'TableTopEccentricAngleTolerance'],
        '0x0051': ['DS', '1', 'TableTopVerticalPositionTolerance'],
        '0x0052': ['DS', '1', 'TableTopLongitudinalPositionTolerance'],
        '0x0053': ['DS', '1', 'TableTopLateralPositionTolerance'],
        '0x0055': ['CS', '1', 'RTPlanRelationship'],
        '0x0070': ['SQ', '1', 'FractionGroupSequence'],
        '0x0071': ['IS', '1', 'FractionGroupNumber'],
        '0x0078': ['IS', '1', 'NumberOfFractionsPlanned'],
        // '0x0079': ['IS','1','NumberOfFractionsPerDay'], /// Changed
        '0x0079': ['IS', '1', 'NumberOfFractionsPatternDigistsPerDay'],
        '0x007A': ['IS', '1', 'RepeatFractionCycleLength'],
        '0x007B': ['LT', '1', 'FractionPattern'],
        '0x0080': ['IS', '1', 'NumberOfBeams'],
        '0x0082': ['DS', '3', 'BeamDoseSpecificationPoint'],
        '0x0084': ['DS', '1', 'BeamDose'],
        '0x0086': ['DS', '1', 'BeamMeterset'],
        '0x00A0': ['IS', '1', 'NumberOfBrachyApplicationSetups'],
        '0x00A2': ['DS', '3', 'BrachyApplicationSetupDoseSpecificationPoint'],
        '0x00A4': ['DS', '1', 'BrachyApplicationSetupDose'],
        '0x00B0': ['SQ', '1', 'BeamSequence'],
        '0x00B2': ['SH', '1', 'TreatmentMachineName'],
        '0x00B3': ['CS', '1', 'PrimaryDosimeterUnit'],
        '0x00B4': ['DS', '1', 'SourceAxisDistance'],
        '0x00B6': ['SQ', '1', 'BeamLimitingDeviceSequence'],
        '0x00B8': ['CS', '1', 'RTBeamLimitingDeviceType'],
        '0x00BA': ['DS', '1', 'SourceToBeamLimitingDeviceDistance'],
        '0x00BC': ['IS', '1', 'NumberOfLeafJawPairs'],
        '0x00BE': ['DS', '3-n', 'LeafPositionBoundaries'],
        '0x00C0': ['IS', '1', 'BeamNumber'],
        '0x00C2': ['LO', '1', 'BeamName'],
        '0x00C3': ['ST', '1', 'BeamDescription'],
        '0x00C4': ['CS', '1', 'BeamType'],
        '0x00C6': ['CS', '1', 'RadiationType'],
        '0x00C8': ['IS', '1', 'ReferenceImageNumber'],
        '0x00CA': ['SQ', '1', 'PlannedVerificationImageSequence'],
        '0x00CC': ['LO', '1-n', 'ImagingDeviceSpecificAcquisitionParameters'],
        '0x00CE': ['CS', '1', 'TreatmentDeliveryType'],
        '0x00D0': ['IS', '1', 'NumberOfWedges'],
        '0x00D1': ['SQ', '1', 'WedgeSequence'],
        '0x00D2': ['IS', '1', 'WedgeNumber'],
        '0x00D3': ['CS', '1', 'WedgeType'],
        '0x00D4': ['SH', '1', 'WedgeID'],
        '0x00D5': ['IS', '1', 'WedgeAngle'],
        '0x00D6': ['DS', '1', 'WedgeFactor'],
        '0x00D8': ['DS', '1', 'WedgeOrientation'],
        '0x00DA': ['DS', '1', 'SourceToWedgeTrayDistance'],
        '0x00E0': ['IS', '1', 'NumberOfCompensators'],
        '0x00E1': ['SH', '1', 'MaterialID'],
        '0x00E2': ['DS', '1', 'TotalCompensatorTrayFactor'],
        '0x00E3': ['SQ', '1', 'CompensatorSequence'],
        '0x00E4': ['IS', '1', 'CompensatorNumber'],
        '0x00E5': ['SH', '1', 'CompensatorID'],
        '0x00E6': ['DS', '1', 'SourceToCompensatorTrayDistance'],
        '0x00E7': ['IS', '1', 'CompensatorRows'],
        '0x00E8': ['IS', '1', 'CompensatorColumns'],
        '0x00E9': ['DS', '2', 'CompensatorPixelSpacing'],
        '0x00EA': ['DS', '2', 'CompensatorPosition'],
        '0x00EB': ['DS', '1-n', 'CompensatorTransmissionData'],
        '0x00EC': ['DS', '1-n', 'CompensatorThicknessData'],
        '0x00ED': ['IS', '1', 'NumberOfBoli'],
        '0x00EE': ['CS', '1', 'CompensatorType'],
        '0x00F0': ['IS', '1', 'NumberOfBlocks'],
        '0x00F2': ['DS', '1', 'TotalBlockTrayFactor'],
        '0x00F4': ['SQ', '1', 'BlockSequence'],
        '0x00F5': ['SH', '1', 'BlockTrayID'],
        '0x00F6': ['DS', '1', 'SourceToBlockTrayDistance'],
        '0x00F8': ['CS', '1', 'BlockType'],
        '0x00FA': ['CS', '1', 'BlockDivergence'],
        '0x00FC': ['IS', '1', 'BlockNumber'],
        '0x00FE': ['LO', '1', 'BlockName'],
        '0x0100': ['DS', '1', 'BlockThickness'],
        '0x0102': ['DS', '1', 'BlockTransmission'],
        '0x0104': ['IS', '1', 'BlockNumberOfPoints'],
        '0x0106': ['DS', '2-2n', 'BlockData'],
        '0x0107': ['SQ', '1', 'ApplicatorSequence'],
        '0x0108': ['SH', '1', 'ApplicatorID'],
        '0x0109': ['CS', '1', 'ApplicatorType'],
        '0x010A': ['LO', '1', 'ApplicatorDescription'],
        '0x010C': ['DS', '1', 'CumulativeDoseReferenceCoefficient'],
        '0x010E': ['DS', '1', 'FinalCumulativeMetersetWeight'],
        '0x0110': ['IS', '1', 'NumberOfControlPoints'],
        '0x0111': ['SQ', '1', 'ControlPointSequence'],
        '0x0112': ['IS', '1', 'ControlPointIndex'],
        '0x0114': ['DS', '1', 'NominalBeamEnergy'],
        '0x0115': ['DS', '1', 'DoseRateSet'],
        '0x0116': ['SQ', '1', 'WedgePositionSequence'],
        '0x0118': ['CS', '1', 'WedgePosition'],
        '0x011A': ['SQ', '1', 'BeamLimitingDevicePositionSequence'],
        '0x011C': ['DS', '2-2n', 'LeafJawPositions'],
        '0x011E': ['DS', '1', 'GantryAngle'],
        '0x011F': ['CS', '1', 'GantryRotationDirection'],
        '0x0120': ['DS', '1', 'BeamLimitingDeviceAngle'],
        '0x0121': ['CS', '1', 'BeamLimitingDeviceRotationDirection'],
        '0x0122': ['DS', '1', 'PatientSupportAngle'],
        '0x0123': ['CS', '1', 'PatientSupportRotationDirection'],
        '0x0124': ['DS', '1', 'TableTopEccentricAxisDistance'],
        '0x0125': ['DS', '1', 'TableTopEccentricAngle'],
        '0x0126': ['CS', '1', 'TableTopEccentricRotationDirection'],
        '0x0128': ['DS', '1', 'TableTopVerticalPosition'],
        '0x0129': ['DS', '1', 'TableTopLongitudinalPosition'],
        '0x012A': ['DS', '1', 'TableTopLateralPosition'],
        '0x012C': ['DS', '3', 'IsocenterPosition'],
        '0x012E': ['DS', '3', 'SurfaceEntryPoint'],
        '0x0130': ['DS', '1', 'SourceToSurfaceDistance'],
        '0x0134': ['DS', '1', 'CumulativeMetersetWeight'],
        '0x0140': ['FL', '1', 'TableTopPitchAngle'],
        '0x0142': ['CS', '1', 'TableTopPitchRotationDirection'],
        '0x0144': ['FL', '1', 'TableTopRollAngle'],
        '0x0146': ['CS', '1', 'TableTopRollRotationDirection'],
        '0x0148': ['FL', '1', 'HeadFixationAngle'],
        '0x014A': ['FL', '1', 'GantryPitchAngle'],
        '0x014C': ['CS', '1', 'GantryPitchRotationDirection'],
        '0x014E': ['FL', '1', 'GantryPitchAngleTolerance'],
        '0x0180': ['SQ', '1', 'PatientSetupSequence'],
        '0x0182': ['IS', '1', 'PatientSetupNumber'],
        '0x0184': ['LO', '1', 'PatientAdditionalPosition'],
        '0x0190': ['SQ', '1', 'FixationDeviceSequence'],
        '0x0192': ['CS', '1', 'FixationDeviceType'],
        '0x0194': ['SH', '1', 'FixationDeviceLabel'],
        '0x0196': ['ST', '1', 'FixationDeviceDescription'],
        '0x0198': ['SH', '1', 'FixationDevicePosition'],
        '0x01A0': ['SQ', '1', 'ShieldingDeviceSequence'],
        '0x01A2': ['CS', '1', 'ShieldingDeviceType'],
        '0x01A4': ['SH', '1', 'ShieldingDeviceLabel'],
        '0x01A6': ['ST', '1', 'ShieldingDeviceDescription'],
        '0x01A8': ['SH', '1', 'ShieldingDevicePosition'],
        '0x01B0': ['CS', '1', 'SetupTechnique'],
        '0x01B2': ['ST', '1', 'SetupTechniqueDescription'],
        '0x01B4': ['SQ', '1', 'SetupDeviceSequence'],
        '0x01B6': ['CS', '1', 'SetupDeviceType'],
        '0x01B8': ['SH', '1', 'SetupDeviceLabel'],
        '0x01BA': ['ST', '1', 'SetupDeviceDescription'],
        '0x01BC': ['DS', '1', 'SetupDeviceParameter'],
        '0x01D0': ['ST', '1', 'SetupReferenceDescription'],
        '0x01D2': ['DS', '1', 'TableTopVerticalSetupDisplacement'],
        '0x01D4': ['DS', '1', 'TableTopLongitudinalSetupDisplacement'],
        '0x01D6': ['DS', '1', 'TableTopLateralSetupDisplacement'],
        '0x0200': ['CS', '1', 'BrachyTreatmentTechnique'],
        '0x0202': ['CS', '1', 'BrachyTreatmentType'],
        '0x0206': ['SQ', '1', 'TreatmentMachineSequence'],
        '0x0210': ['SQ', '1', 'SourceSequence'],
        '0x0212': ['IS', '1', 'SourceNumber'],
        '0x0214': ['CS', '1', 'SourceType'],
        '0x0216': ['LO', '1', 'SourceManufacturer'],
        '0x0218': ['DS', '1', 'ActiveSourceDiameter'],
        '0x021A': ['DS', '1', 'ActiveSourceLength'],
        '0x0222': ['DS', '1', 'SourceEncapsulationNominalThickness'],
        '0x0224': ['DS', '1', 'SourceEncapsulationNominalTransmission'],
        '0x0226': ['LO', '1', 'SourceIsotopeName'],
        '0x0228': ['DS', '1', 'SourceIsotopeHalfLife'],
        '0x022A': ['DS', '1', 'ReferenceAirKermaRate'],
        '0x022C': ['DA', '1', 'AirKermaRateReferenceDate'],
        '0x022E': ['TM', '1', 'AirKermaRateReferenceTime'],
        '0x0230': ['SQ', '1', 'ApplicationSetupSequence'],
        '0x0232': ['CS', '1', 'ApplicationSetupType'],
        '0x0234': ['IS', '1', 'ApplicationSetupNumber'],
        '0x0236': ['LO', '1', 'ApplicationSetupName'],
        '0x0238': ['LO', '1', 'ApplicationSetupManufacturer'],
        '0x0240': ['IS', '1', 'TemplateNumber'],
        '0x0242': ['SH', '1', 'TemplateType'],
        '0x0244': ['LO', '1', 'TemplateName'],
        '0x0250': ['DS', '1', 'TotalReferenceAirKerma'],
        '0x0260': ['SQ', '1', 'BrachyAccessoryDeviceSequence'],
        '0x0262': ['IS', '1', 'BrachyAccessoryDeviceNumber'],
        '0x0263': ['SH', '1', 'BrachyAccessoryDeviceID'],
        '0x0264': ['CS', '1', 'BrachyAccessoryDeviceType'],
        '0x0266': ['LO', '1', 'BrachyAccessoryDeviceName'],
        '0x026A': ['DS', '1', 'BrachyAccessoryDeviceNominalThickness'],
        '0x026C': ['DS', '1', 'BrachyAccessoryDeviceNominalTransmission'],
        '0x0280': ['SQ', '1', 'ChannelSequence'],
        '0x0282': ['IS', '1', 'ChannelNumber'],
        '0x0284': ['DS', '1', 'ChannelLength'],
        '0x0286': ['DS', '1', 'ChannelTotalTime'],
        '0x0288': ['CS', '1', 'SourceMovementType'],
        '0x028A': ['IS', '1', 'NumberOfPulses'],
        '0x028C': ['DS', '1', 'PulseRepetitionInterval'],
        '0x0290': ['IS', '1', 'SourceApplicatorNumber'],
        '0x0291': ['SH', '1', 'SourceApplicatorID'],
        '0x0292': ['CS', '1', 'SourceApplicatorType'],
        '0x0294': ['LO', '1', 'SourceApplicatorName'],
        '0x0296': ['DS', '1', 'SourceApplicatorLength'],
        '0x0298': ['LO', '1', 'SourceApplicatorManufacturer'],
        '0x029C': ['DS', '1', 'SourceApplicatorWallNominalThickness'],
        '0x029E': ['DS', '1', 'SourceApplicatorWallNominalTransmission'],
        '0x02A0': ['DS', '1', 'SourceApplicatorStepSize'],
        '0x02A2': ['IS', '1', 'TransferTubeNumber'],
        '0x02A4': ['DS', '1', 'TransferTubeLength'],
        '0x02B0': ['SQ', '1', 'ChannelShieldSequence'],
        '0x02B2': ['IS', '1', 'ChannelShieldNumber'],
        '0x02B3': ['SH', '1', 'ChannelShieldID'],
        '0x02B4': ['LO', '1', 'ChannelShieldName'],
        '0x02B8': ['DS', '1', 'ChannelShieldNominalThickness'],
        '0x02BA': ['DS', '1', 'ChannelShieldNominalTransmission'],
        '0x02C8': ['DS', '1', 'FinalCumulativeTimeWeight'],
        '0x02D0': ['SQ', '1', 'BrachyControlPointSequence'],
        '0x02D2': ['DS', '1', 'ControlPointRelativePosition'],
        '0x02D4': ['DS', '3', 'ControlPointDPosition'],
        '0x02D6': ['DS', '1', 'CumulativeTimeWeight'],
    },
    '0x300C': {
        '0x0000': ['UL', '1', 'RTRelationshipGroupLength'],
        '0x0002': ['SQ', '1', 'ReferencedRTPlanSequence'],
        '0x0004': ['SQ', '1', 'ReferencedBeamSequence'],
        '0x0006': ['IS', '1', 'ReferencedBeamNumber'],
        '0x0007': ['IS', '1', 'ReferencedReferenceImageNumber'],
        '0x0008': ['DS', '1', 'StartCumulativeMetersetWeight'],
        '0x0009': ['DS', '1', 'EndCumulativeMetersetWeight'],
        '0x000A': ['SQ', '1', 'ReferencedBrachyApplicationSetupSequence'],
        '0x000C': ['IS', '1', 'ReferencedBrachyApplicationSetupNumber'],
        '0x000E': ['IS', '1', 'ReferencedSourceNumber'],
        '0x0020': ['SQ', '1', 'ReferencedFractionGroupSequence'],
        '0x0022': ['IS', '1', 'ReferencedFractionGroupNumber'],
        '0x0040': ['SQ', '1', 'ReferencedVerificationImageSequence'],
        '0x0042': ['SQ', '1', 'ReferencedReferenceImageSequence'],
        '0x0050': ['SQ', '1', 'ReferencedDoseReferenceSequence'],
        '0x0051': ['IS', '1', 'ReferencedDoseReferenceNumber'],
        '0x0055': ['SQ', '1', 'BrachyReferencedDoseReferenceSequence'],
        '0x0060': ['SQ', '1', 'ReferencedStructureSetSequence'],
        '0x006A': ['IS', '1', 'ReferencedPatientSetupNumber'],
        '0x0080': ['SQ', '1', 'ReferencedDoseSequence'],
        '0x00A0': ['IS', '1', 'ReferencedToleranceTableNumber'],
        '0x00B0': ['SQ', '1', 'ReferencedBolusSequence'],
        '0x00C0': ['IS', '1', 'ReferencedWedgeNumber'],
        '0x00D0': ['IS', '1', 'ReferencedCompensatorNumber'],
        '0x00E0': ['IS', '1', 'ReferencedBlockNumber'],
        '0x00F0': ['IS', '1', 'ReferencedControlPointIndex'],
    },
    '0x300E': {
        '0x0000': ['UL', '1', 'RTApprovalGroupLength'],
        '0x0002': ['CS', '1', 'ApprovalStatus'],
        '0x0004': ['DA', '1', 'ReviewDate'],
        '0x0005': ['TM', '1', 'ReviewTime'],
        '0x0008': ['PN', '1', 'ReviewerName'],
    },
    '0x4000': {
        '0x0000': ['UL', '1', 'TextGroupLength'],
        '0x0010': ['LT', '1-n', 'TextArbitrary'],
        '0x4000': ['LT', '1-n', 'TextComments'],
    },
    '0x4008': {
        '0x0000': ['UL', '1', 'ResultsGroupLength'],
        '0x0040': ['SH', '1', 'ResultsID'],
        '0x0042': ['LO', '1', 'ResultsIDIssuer'],
        '0x0050': ['SQ', '1', 'ReferencedInterpretationSequence'],
        '0x0100': ['DA', '1', 'InterpretationRecordedDate'],
        '0x0101': ['TM', '1', 'InterpretationRecordedTime'],
        '0x0102': ['PN', '1', 'InterpretationRecorder'],
        '0x0103': ['LO', '1', 'ReferenceToRecordedSound'],
        '0x0108': ['DA', '1', 'InterpretationTranscriptionDate'],
        '0x0109': ['TM', '1', 'InterpretationTranscriptionTime'],
        '0x010A': ['PN', '1', 'InterpretationTranscriber'],
        '0x010B': ['ST', '1', 'InterpretationText'],
        '0x010C': ['PN', '1', 'InterpretationAuthor'],
        '0x0111': ['SQ', '1', 'InterpretationApproverSequence'],
        '0x0112': ['DA', '1', 'InterpretationApprovalDate'],
        '0x0113': ['TM', '1', 'InterpretationApprovalTime'],
        '0x0114': ['PN', '1', 'PhysicianApprovingInterpretation'],
        '0x0115': ['LT', '1', 'InterpretationDiagnosisDescription'],
        '0x0117': ['SQ', '1', 'DiagnosisCodeSequence'],
        '0x0118': ['SQ', '1', 'ResultsDistributionListSequence'],
        '0x0119': ['PN', '1', 'DistributionName'],
        '0x011A': ['LO', '1', 'DistributionAddress'],
        '0x0200': ['SH', '1', 'InterpretationID'],
        '0x0202': ['LO', '1', 'InterpretationIDIssuer'],
        '0x0210': ['CS', '1', 'InterpretationTypeID'],
        '0x0212': ['CS', '1', 'InterpretationStatusID'],
        '0x0300': ['ST', '1', 'Impressions'],
        '0x4000': ['ST', '1', 'ResultsComments'],
    },
    '0x5000': {
        '0x0000': ['UL', '1', 'CurveGroupLength'],
        '0x0005': ['US', '1', 'CurveDimensions'],
        '0x0010': ['US', '1', 'NumberOfPoints'],
        '0x0020': ['CS', '1', 'TypeOfData'],
        '0x0022': ['LO', '1', 'CurveDescription'],
        '0x0030': ['SH', '1-n', 'AxisUnits'],
        '0x0040': ['SH', '1-n', 'AxisLabels'],
        '0x0103': ['US', '1', 'DataValueRepresentation'],
        '0x0104': ['US', '1-n', 'MinimumCoordinateValue'],
        '0x0105': ['US', '1-n', 'MaximumCoordinateValue'],
        '0x0106': ['SH', '1-n', 'CurveRange'],
        '0x0110': ['US', '1', 'CurveDataDescriptor'],
        '0x0112': ['US', '1', 'CoordinateStartValue'],
        '0x0114': ['US', '1', 'CoordinateStepValue'],
        '0x2000': ['US', '1', 'AudioType'],
        '0x2002': ['US', '1', 'AudioSampleFormat'],
        '0x2004': ['US', '1', 'NumberOfChannels'],
        '0x2006': ['UL', '1', 'NumberOfSamples'],
        '0x2008': ['UL', '1', 'SampleRate'],
        '0x200A': ['UL', '1', 'TotalTime'],
        '0x200C': ['OX', '1', 'AudioSampleData'],
        '0x200E': ['LT', '1', 'AudioComments'],
        '0x3000': ['OX', '1', 'CurveData'],
    },
    '0x5400': {
        '0x0100': ['SQ', '1', 'WaveformSequence'],
        '0x0110': ['OW/OB', '1', 'ChannelMinimumValue'],
        '0x0112': ['OW/OB', '1', 'ChannelMaximumValue'],
        '0x1004': ['US', '1', 'WaveformBitsAllocated'],
        '0x1006': ['CS', '1', 'WaveformSampleInterpretation'],
        '0x100A': ['OW/OB', '1', 'WaveformPaddingValue'],
        '0x1010': ['OW/OB', '1', 'WaveformData'],
    },
    '0x6000': {
        '0x0000': ['UL', '1', 'OverlayGroupLength'],
        '0x0010': ['US', '1', 'OverlayRows'],
        '0x0011': ['US', '1', 'OverlayColumns'],
        '0x0012': ['US', '1', 'OverlayPlanes'],
        '0x0015': ['IS', '1', 'OverlayNumberOfFrames'],
        '0x0040': ['CS', '1', 'OverlayType'],
        '0x0050': ['SS', '2', 'OverlayOrigin'],
        '0x0051': ['US', '1', 'OverlayImageFrameOrigin'],
        '0x0052': ['US', '1', 'OverlayPlaneOrigin'],
        '0x0060': ['CS', '1', 'OverlayCompressionCode'],
        '0x0061': ['SH', '1', 'OverlayCompressionOriginator'],
        '0x0062': ['SH', '1', 'OverlayCompressionLabel'],
        '0x0063': ['SH', '1', 'OverlayCompressionDescription'],
        '0x0066': ['AT', '1-n', 'OverlayCompressionStepPointers'],
        '0x0068': ['US', '1', 'OverlayRepeatInterval'],
        '0x0069': ['US', '1', 'OverlayBitsGrouped'],
        '0x0100': ['US', '1', 'OverlayBitsAllocated'],
        '0x0102': ['US', '1', 'OverlayBitPosition'],
        '0x0110': ['CS', '1', 'OverlayFormat'],
        '0x0200': ['US', '1', 'OverlayLocation'],
        '0x0800': ['CS', '1-n', 'OverlayCodeLabel'],
        '0x0802': ['US', '1', 'OverlayNumberOfTables'],
        '0x0803': ['AT', '1-n', 'OverlayCodeTableLocation'],
        '0x0804': ['US', '1', 'OverlayBitsForCodeWord'],
        '0x1100': ['US', '1', 'OverlayDescriptorGray'],
        '0x1101': ['US', '1', 'OverlayDescriptorRed'],
        '0x1102': ['US', '1', 'OverlayDescriptorGreen'],
        '0x1103': ['US', '1', 'OverlayDescriptorBlue'],
        '0x1200': ['US', '1-n', 'OverlayGray'],
        '0x1201': ['US', '1-n', 'OverlayRed'],
        '0x1202': ['US', '1-n', 'OverlayGreen'],
        '0x1203': ['US', '1-n', 'OverlayBlue'],
        '0x1301': ['IS', '1', 'ROIArea'],
        '0x1302': ['DS', '1', 'ROIMean'],
        '0x1303': ['DS', '1', 'ROIStandardDeviation'],
        '0x3000': ['OW', '1', 'OverlayData'],
        '0x4000': ['LT', '1-n', 'OverlayComments'],
    },
    '0x7F00': {
        '0x0000': ['UL', '1', 'VariablePixelDataGroupLength'],
        '0x0010': ['OX', '1', 'VariablePixelData'],
        '0x0011': ['AT', '1', 'VariableNextDataGroup'],
        '0x0020': ['OW', '1-n', 'VariableCoefficientsSDVN'],
        '0x0030': ['OW', '1-n', 'VariableCoefficientsSDHN'],
        '0x0040': ['OW', '1-n', 'VariableCoefficientsSDDN'],
    },
    '0x7FE0': {
        '0x0000': ['UL', '1', 'PixelDataGroupLength'],
        '0x0010': ['OX', '1', 'PixelData'],
        '0x0020': ['OW', '1-n', 'CoefficientsSDVN'],
        '0x0030': ['OW', '1-n', 'CoefficientsSDHN'],
        '0x0040': ['OW', '1-n', 'CoefficientsSDDN'],
    },
    '0xFFFC': {
        '0xFFFC': ['OB', '1', 'DataSetTrailingPadding'],
    },
    '0xFFFE': {
        '0xE000': ['NONE', '1', 'Item'],
        '0xE00D': ['NONE', '1', 'ItemDelimitationItem'],
        '0xE0DD': ['NONE', '1', 'SequenceDelimitationItem'],
    },
}; // dwv.dicom.Dictionnary

/** 
 * Browser module.
 * @module browser
 */
var dwv = dwv || {};
/**
 * Namespace for browser related functions.
 * @class browser
 * @namespace dwv
 * @static
 */
dwv.browser = dwv.browser || {};

/**
 * Browser check for the FileAPI.
 * @method hasFileApi
 * @static
 */ 
dwv.browser.hasFileApi = function()
{
    // regular test does not work on Safari 5
    var isSafari5 = (navigator.appVersion.indexOf("Safari") !== -1) &&
        (navigator.appVersion.indexOf("Chrome") === -1) &&
        ( (navigator.appVersion.indexOf("5.0.") !== -1) ||
          (navigator.appVersion.indexOf("5.1.") !== -1) );
    if( isSafari5 ) 
    {
        console.warn("Assuming FileAPI support for Safari5...");
        return true;
    }
    // regular test
    return "FileReader" in window;
};

/**
 * Browser check for the XMLHttpRequest.
 * @method hasXmlHttpRequest
 * @static
 */ 
dwv.browser.hasXmlHttpRequest = function()
{
    return "XMLHttpRequest" in window && "withCredentials" in new XMLHttpRequest();
};

/**
 * Browser check for typed array.
 * @method hasTypedArray
 * @static
 */ 
dwv.browser.hasTypedArray = function()
{
    return "Uint8Array" in window && "Uint16Array" in window;
};

/**
 * Browser check for clamped array.
 * @method hasClampedArray
 * @static
 */ 
dwv.browser.hasClampedArray = function()
{
    return "Uint8ClampedArray" in window;
};

/**
 * Browser checks to see if it can run dwv. Throws an error if not.
 * TODO Maybe use http://modernizr.com/.
 * @method check
 * @static
 */ 
dwv.browser.check = function()
{
    var appnorun = "The application cannot be run.";
    var message = "";
    // Check for the File API support
    if( !dwv.browser.hasFileApi() ) {
        message = "The File APIs are not supported in this browser. ";
        alert(message+appnorun);
        throw new Error(message);
    }
    // Check for XMLHttpRequest
    if( !dwv.browser.hasXmlHttpRequest() ) {
        message = "The XMLHttpRequest is not supported in this browser. ";
        alert(message+appnorun);
        throw new Error(message);
    }
    // Check typed array
    if( !dwv.browser.hasTypedArray() ) {
        message = "The Typed arrays are not supported in this browser. ";
        alert(message+appnorun);
        throw new Error(message);
    }
    // check clamped array
    if( !dwv.browser.hasClampedArray() ) {
        // silent fail since IE does not support it...
        console.warn("The Uint8ClampedArray is not supported in this browser. This may impair performance. ");
    }
};
/** 
 * Image module.
 * @module image
 */
var dwv = dwv || {};
dwv.image = dwv.image || {};

/**
 * Image Size class.
 * Supports 2D and 3D images.
 * @class Size
 * @namespace dwv.image
 * @constructor
 * @param {Number} numberOfColumns The number of columns.
 * @param {Number} numberOfRows The number of rows.
 * @param {Number} numberOfSlices The number of slices.
*/
dwv.image.Size = function( numberOfColumns, numberOfRows, numberOfSlices )
{
    /**
     * Get the number of columns.
     * @method getNumberOfColumns
     * @return {Number} The number of columns.
     */ 
    this.getNumberOfColumns = function() { return numberOfColumns; };
    /**
     * Get the number of rows.
     * @method getNumberOfRows
     * @return {Number} The number of rows.
     */ 
    this.getNumberOfRows = function() { return numberOfRows; };
    /**
     * Get the number of slices.
     * @method getNumberOfSlices
     * @return {Number} The number of slices.
     */ 
    this.getNumberOfSlices = function() { return (numberOfSlices || 1.0); };
};

/**
 * Get the size of a slice.
 * @method getSliceSize
 * @return {Number} The size of a slice.
 */ 
dwv.image.Size.prototype.getSliceSize = function() {
    return this.getNumberOfColumns()*this.getNumberOfRows();
};

/**
 * Get the total size.
 * @method getTotalSize
 * @return {Number} The total size.
 */ 
dwv.image.Size.prototype.getTotalSize = function() {
    return this.getSliceSize()*this.getNumberOfSlices();
};

/**
 * Check for equality.
 * @method equals
 * @param {Size} rhs The object to compare to.
 * @return {Boolean} True if both objects are equal.
 */ 
dwv.image.Size.prototype.equals = function(rhs) {
    return rhs !== null &&
        this.getNumberOfColumns() === rhs.getNumberOfColumns() &&
        this.getNumberOfRows() === rhs.getNumberOfRows() &&
        this.getNumberOfSlices() === rhs.getNumberOfSlices();
};

/**
 * Check that coordinates are within bounds.
 * @method isInBounds
 * @param {Number} i The column coordinate.
 * @param {Number} j The row coordinate.
 * @param {Number} k The slice coordinate.
 * @return {Boolean} True if the given coordinates are within bounds.
 */ 
dwv.image.Size.prototype.isInBounds = function( i, j, k ) {
    if( i < 0 || i > this.getNumberOfColumns() - 1 ||
        j < 0 || j > this.getNumberOfRows() - 1 ||
        k < 0 || k > this.getNumberOfSlices() - 1 ) {
        return false;
    }
    return true;
};

/**
 * Image Spacing class. 
 * Supports 2D and 3D images.
 * @class Spacing
 * @namespace dwv.image
 * @constructor
 * @param {Number} columnSpacing The column spacing.
 * @param {Number} rowSpacing The row spacing.
 * @param {Number} sliceSpacing The slice spacing.
 */
dwv.image.Spacing = function( columnSpacing, rowSpacing, sliceSpacing )
{
    /**
     * Get the column spacing.
     * @method getColumnSpacing
     * @return {Number} The column spacing.
     */ 
    this.getColumnSpacing = function() { return columnSpacing; };
    /**
     * Get the row spacing.
     * @method getRowSpacing
     * @return {Number} The row spacing.
     */ 
    this.getRowSpacing = function() { return rowSpacing; };
    /**
     * Get the slice spacing.
     * @method getSliceSpacing
     * @return {Number} The slice spacing.
     */ 
    this.getSliceSpacing = function() { return (sliceSpacing || 1.0); };
};

/**
 * Check for equality.
 * @method equals
 * @param {Spacing} rhs The object to compare to.
 * @return {Boolean} True if both objects are equal.
 */ 
dwv.image.Spacing.prototype.equals = function(rhs) {
    return rhs !== null &&
        this.getColumnSpacing() === rhs.getColumnSpacing() &&
        this.getRowSpacing() === rhs.getRowSpacing() &&
        this.getSliceSpacing() === rhs.getSliceSpacing();
};

/**
 * Image class.
 * Usable once created, optional are:
 * - rescale slope and intercept (default 1:0), 
 * - photometric interpretation (default MONOCHROME2),
 * - planar configuration (default RGBRGB...).
 * @class Image
 * @namespace dwv.image
 * @constructor
 * @param {Size} size The size of the image.
 * @param {Spacing} spacing The spacing of the image.
 * @param {Array} buffer The image data.
 * @param {Array} slicePositions The slice positions.
 */
dwv.image.Image = function(size, spacing, buffer, slicePositions)
{
    /**
     * Rescale slope.
     * @property rescaleSlope
     * @private
     * @type Number
     */
    var rescaleSlope = 1;
    /**
     * Rescale intercept.
     * @property rescaleIntercept
     * @private
     * @type Number
     */
    var rescaleIntercept = 0;
    /**
     * Photometric interpretation (MONOCHROME, RGB...).
     * @property photometricInterpretation
     * @private
     * @type String
     */
    var photometricInterpretation = "MONOCHROME2";
    /**
     * Planar configuration for RGB data (0:RGBRGBRGBRGB... or 1:RRR...GGG...BBB...).
     * @property planarConfiguration
     * @private
     * @type Number
     */
    var planarConfiguration = 0;
    /**
     * Number of components.
     * @property planarConfiguration
     * @private
     * @type Number
     */
    var numberOfComponents = buffer.length / size.getTotalSize();
    /**
     * Meta information.
     * @property meta
     * @private
     * @type Object
     */
    var meta = {};
    
    /**
     * Original buffer.
     * @property originalBuffer
     * @private
     * @type Array
     */
    var originalBuffer = new Int16Array(buffer);
    
    // check slice positions.
    if( typeof(slicePositions) === 'undefined' ) {
        slicePositions = [[0,0,0]];
    }
    
    /**
     * Data range.
     * @property dataRange
     * @private
     * @type Object
     */
    var dataRange = null;
    /**
     * Histogram.
     * @property histogram
     * @private
     * @type Array
     */
    var histogram = null;
     
    /**
     * Get the size of the image.
     * @method getSize
     * @return {Size} The size of the image.
     */ 
    this.getSize = function() { return size; };
    /**
     * Get the spacing of the image.
     * @method getSpacing
     * @return {Spacing} The spacing of the image.
     */ 
    this.getSpacing = function() { return spacing; };
    /**
     * Get the data buffer of the image. TODO dangerous...
     * @method getBuffer
     * @return {Array} The data buffer of the image.
     */ 
    this.getBuffer = function() { return buffer; };
    /**
     * Get the slice positions.
     * @method getSlicePositions
     * @return {Array} The slice positions.
     */ 
    this.getSlicePositions = function() { return slicePositions; };
    
    /**
     * Get the rescale slope.
     * @method getRescaleSlope
     * @return {Number} The rescale slope.
     */ 
    this.getRescaleSlope = function() { return rescaleSlope; };
    /**
     * Set the rescale slope.
     * @method setRescaleSlope
     * @param {Number} rs The rescale slope.
     */ 
    this.setRescaleSlope = function(rs) { rescaleSlope = rs; };
    /**
     * Get the rescale intercept.
     * @method getRescaleIntercept
     * @return {Number} The rescale intercept.
     */ 
    this.getRescaleIntercept = function() { return rescaleIntercept; };
    /**
     * Set the rescale intercept.
     * @method setRescaleIntercept
     * @param {Number} ri The rescale intercept.
     */ 
    this.setRescaleIntercept = function(ri) { rescaleIntercept = ri; };
    /**
     * Get the photometricInterpretation of the image.
     * @method getPhotometricInterpretation
     * @return {String} The photometricInterpretation of the image.
     */ 
    this.getPhotometricInterpretation = function() { return photometricInterpretation; };
    /**
     * Set the photometricInterpretation of the image.
     * @method setPhotometricInterpretation
     * @pqrqm {String} interp The photometricInterpretation of the image.
     */ 
    this.setPhotometricInterpretation = function(interp) { photometricInterpretation = interp; };
    /**
     * Get the planarConfiguration of the image.
     * @method getPlanarConfiguration
     * @return {Number} The planarConfiguration of the image.
     */ 
    this.getPlanarConfiguration = function() { return planarConfiguration; };
    /**
     * Set the planarConfiguration of the image.
     * @method setPlanarConfiguration
     * @param {Number} config The planarConfiguration of the image.
     */ 
    this.setPlanarConfiguration = function(config) { planarConfiguration = config; };
    /**
     * Get the numberOfComponents of the image.
     * @method getNumberOfComponents
     * @return {Number} The numberOfComponents of the image.
     */ 
    this.getNumberOfComponents = function() { return numberOfComponents; };

    /**
     * Get the meta information of the image.
     * @method getMeta
     * @return {Object} The meta information of the image.
     */ 
    this.getMeta = function() { return meta; };
    /**
     * Set the meta information of the image.
     * @method setMeta
     * @param {Object} rhs The meta information of the image.
     */ 
    this.setMeta = function(rhs) { meta = rhs; };

    /**
     * Get value at offset. Warning: No size check...
     * @method getValueAtOffset
     * @param {Number} offset The desired offset.
     * @return {Number} The value at offset.
     */ 
    this.getValueAtOffset = function(offset) {
        return buffer[offset];
    };
    
    /**
     * Clone the image.
     * @method clone
     * @return {Image} A clone of this image.
     */ 
    this.clone = function()
    {
        var copy = new dwv.image.Image(this.getSize(), this.getSpacing(), originalBuffer, slicePositions);
        copy.setRescaleSlope(this.getRescaleSlope());
        copy.setRescaleIntercept(this.getRescaleIntercept());
        copy.setPhotometricInterpretation(this.getPhotometricInterpretation());
        copy.setPlanarConfiguration(this.getPlanarConfiguration());
        copy.setMeta(this.getMeta());
        return copy;
    };
    
    /**
     * Append a slice to the image.
     * @method appendSlice
     * @param {Image} The slice to append.
     */ 
    this.appendSlice = function(rhs)
    {
        // check input
        if( rhs === null ) {
            throw new Error("Cannot append null slice");
        }
        if( rhs.getSize().getNumberOfSlices() !== 1 ) {
            throw new Error("Cannot append more than one slice");
        }
        if( size.getNumberOfColumns() !== rhs.getSize().getNumberOfColumns() ) {
            throw new Error("Cannot append a slice with different number of columns");
        }
        if( size.getNumberOfRows() !== rhs.getSize().getNumberOfRows() ) {
            throw new Error("Cannot append a slice with different number of rows");
        }
        if( photometricInterpretation !== rhs.getPhotometricInterpretation() ) {
            throw new Error("Cannot append a slice with different photometric interpretation");
        }
        // all meta should be equal
        for( var key in meta ) {
            if( meta[key] !== rhs.getMeta()[key] ) {
                throw new Error("Cannot append a slice with different "+key);
            }
        }
        
        // find index where to append slice
        var closestSliceIndex = 0;
        var slicePosition = rhs.getSlicePositions()[0];
        var minDiff = Math.abs( slicePositions[0][2] - slicePosition[2] );
        var diff = 0;
        for( var i = 0; i < slicePositions.length; ++i )
        {
            diff = Math.abs( slicePositions[i][2] - slicePosition[2] );
            if( diff < minDiff ) 
            {
                minDiff = diff;
                closestSliceIndex = i;
            }
        }
        diff = slicePositions[closestSliceIndex][2] - slicePosition[2];
        var newSliceNb = ( diff > 0 ) ? closestSliceIndex : closestSliceIndex + 1;
        
        // new size
        var newSize = new dwv.image.Size(size.getNumberOfColumns(),
                size.getNumberOfRows(),
                size.getNumberOfSlices() + 1 );
        
        // calculate slice size
        var mul = 1;
        if( photometricInterpretation === "RGB" ) {
            mul = 3;
        }
        var sliceSize = mul * size.getSliceSize();
        
        // create the new buffer
        var newBuffer = new Int16Array(sliceSize * newSize.getNumberOfSlices());
        
        // append slice at new position
        if( newSliceNb === 0 )
        {
            newBuffer.set(rhs.getBuffer());
            newBuffer.set(buffer, sliceSize);
        }
        else if( newSliceNb === size.getNumberOfSlices() )
        {
            newBuffer.set(buffer);
            newBuffer.set(rhs.getBuffer(), size.getNumberOfSlices() * sliceSize);
        }
        else
        {
            var offset = newSliceNb * sliceSize;
            newBuffer.set(buffer.subarray(0, offset - 1));
            newBuffer.set(rhs.getBuffer(), offset);
            newBuffer.set(buffer.subarray(offset), offset + sliceSize);
        }
        
        // update slice positions
        slicePositions.splice(newSliceNb, 0, slicePosition);
        
        // copy to class variables
        size = newSize;
        buffer = newBuffer;
        originalBuffer = new Int16Array(newBuffer);
    };
    
    /**
     * Get the data range.
     * @method getDataRange
     * @return {Object} The data range.
     */ 
    this.getDataRange = function() { 
        if( !dataRange ) {
            dataRange = this.calculateDataRange();
        }
        return dataRange;
    };

    /**
     * Get the histogram.
     * @method getHistogram
     * @return {Array} The histogram.
     */ 
    this.getHistogram = function() { 
        if( !histogram ) {
            histogram = this.calculateHistogram();
        }
        return histogram;
    };
};

/**
 * Get the value of the image at a specific coordinate.
 * @method getValue
 * @param {Number} i The X index.
 * @param {Number} j The Y index.
 * @param {Number} k The Z index.
 * @return {Number} The value at the desired position.
 * Warning: No size check...
 */
dwv.image.Image.prototype.getValue = function( i, j, k )
{
    return this.getValueAtOffset( i +
        ( j * this.getSize().getNumberOfColumns() ) +
        ( k * this.getSize().getSliceSize()) );
};

/**
 * Get the rescaled value of the image at a specific offset.
 * @method getRescaledValueAtOffset
 * @param {Number} offset The offset in the buffer. 
 * @return {Number} The rescaled value at the desired offset.
 * Warning: No size check...
 */
dwv.image.Image.prototype.getRescaledValueAtOffset = function( offset )
{
    return (this.getValueAtOffset(offset)*this.getRescaleSlope())+this.getRescaleIntercept();
};

/**
 * Get the rescaled value of the image at a specific coordinate.
 * @method getRescaledValue
 * @param {Number} i The X index.
 * @param {Number} j The Y index.
 * @param {Number} k The Z index.
 * @return {Number} The rescaled value at the desired position.
 * Warning: No size check...
 */
dwv.image.Image.prototype.getRescaledValue = function( i, j, k )
{
    return (this.getValue(i,j,k)*this.getRescaleSlope())+this.getRescaleIntercept();
};

/**
 * Calculate the raw image data range.
 * @method calculateDataRange
 * @return {Object} The range {min, max}.
 */
dwv.image.Image.prototype.calculateDataRange = function()
{
    var min = this.getValueAtOffset(0);
    var max = min;
    var value = 0;
    for(var i=0; i < this.getSize().getTotalSize(); ++i)
    {    
        value = this.getValueAtOffset(i);
        if( value > max ) { max = value; }
        if( value < min ) { min = value; }
    }
    return { "min": min, "max": max };
};

/**
 * Calculate the image data range after rescale.
 * @method getRescaledDataRange
 * @return {Object} The rescaled data range {min, max}.
 */
dwv.image.Image.prototype.getRescaledDataRange = function()
{
    var rawRange = this.getDataRange();
    return { "min": rawRange.min*this.getRescaleSlope()+this.getRescaleIntercept(),
        "max": rawRange.max*this.getRescaleSlope()+this.getRescaleIntercept()};
};

/**
 * Calculate the histogram of the image.
 * @method calculateHistogram
 * @return {Array} An array representing the histogram.
 */
dwv.image.Image.prototype.calculateHistogram = function()
{
    var histo = [];
    var histoPlot = [];
    var value = 0;
    var size = this.getSize().getTotalSize();
    for ( var i = 0; i < size; ++i ) {    
        value = this.getRescaledValueAtOffset(i);
        histo[value] = ( histo[value] || 0 ) + 1;
    }
    // generate data for plotting
    var min = this.getRescaledDataRange().min;
    var max = this.getRescaledDataRange().max;
    for ( var j = min; j <= max; ++j ) {    
        histoPlot.push([j, ( histo[j] || 0 ) ]);
    }
    return histoPlot;
};

/**
 * Convolute the image with a given 2D kernel.
 * @method convolute2D
 * @param {Array} weights The weights of the 2D kernel as a 3x3 matrix.
 * @return {Image} The convoluted image.
 * Note: Uses the raw buffer values.
 */
dwv.image.Image.prototype.convolute2D = function(weights)
{
    if(weights.length !== 9) {
        throw new Error("The convolution matrix does not have a length of 9; it has "+weights.length);
    }

    var newImage = this.clone();
    var newBuffer = newImage.getBuffer();

    var ncols = this.getSize().getNumberOfColumns();
    var nrows = this.getSize().getNumberOfRows();
    var nslices = this.getSize().getNumberOfSlices();
    var ncomp = this.getNumberOfComponents();
    
    // adapt to number of component and planar configuration
    var factor = 1;
    var componentOffset = 1;
    if( ncomp === 3 )
    {
        if( this.getPlanarConfiguration() === 0 )
        {
            factor = 3;
        }
        else
        {
            componentOffset = this.getSize().getTotalSize();
        }
    }
    
    // allow special indent for matrices
    /*jshint indent:false */

    // default weight offset matrix
    var wOff = [];
    wOff[0] = (-ncols-1) * factor; wOff[1] = (-ncols) * factor; wOff[2] = (-ncols+1) * factor;
    wOff[3] = -factor; wOff[4] = 0; wOff[5] = 1 * factor;
    wOff[6] = (ncols-1) * factor; wOff[7] = (ncols) * factor; wOff[8] = (ncols+1) * factor;
    
    // border weight offset matrices
    // borders are extended (see http://en.wikipedia.org/wiki/Kernel_%28image_processing%29)
    
    // i=0, j=0
    var wOff00 = [];
    wOff00[0] = wOff[4]; wOff00[1] = wOff[4]; wOff00[2] = wOff[5];
    wOff00[3] = wOff[4]; wOff00[4] = wOff[4]; wOff00[5] = wOff[5];
    wOff00[6] = wOff[7]; wOff00[7] = wOff[7]; wOff00[8] = wOff[8];
    // i=0, j=*
    var wOff0x = [];
    wOff0x[0] = wOff[1]; wOff0x[1] = wOff[1]; wOff0x[2] = wOff[2];
    wOff0x[3] = wOff[4]; wOff0x[4] = wOff[4]; wOff0x[5] = wOff[5];
    wOff0x[6] = wOff[7]; wOff0x[7] = wOff[7]; wOff0x[8] = wOff[8];
    // i=0, j=nrows
    var wOff0n = [];
    wOff0n[0] = wOff[1]; wOff0n[1] = wOff[1]; wOff0n[2] = wOff[2];
    wOff0n[3] = wOff[4]; wOff0n[4] = wOff[4]; wOff0n[5] = wOff[5];
    wOff0n[6] = wOff[4]; wOff0n[7] = wOff[4]; wOff0n[8] = wOff[5];
    
    // i=*, j=0
    var wOffx0 = [];
    wOffx0[0] = wOff[3]; wOffx0[1] = wOff[4]; wOffx0[2] = wOff[5];
    wOffx0[3] = wOff[3]; wOffx0[4] = wOff[4]; wOffx0[5] = wOff[5];
    wOffx0[6] = wOff[6]; wOffx0[7] = wOff[7]; wOffx0[8] = wOff[8];
    // i=*, j=* -> wOff
    // i=*, j=nrows
    var wOffxn = [];
    wOffxn[0] = wOff[0]; wOffxn[1] = wOff[1]; wOffxn[2] = wOff[2];
    wOffxn[3] = wOff[3]; wOffxn[4] = wOff[4]; wOffxn[5] = wOff[5];
    wOffxn[6] = wOff[3]; wOffxn[7] = wOff[4]; wOffxn[8] = wOff[5];
    
    // i=ncols, j=0
    var wOffn0 = [];
    wOffn0[0] = wOff[3]; wOffn0[1] = wOff[4]; wOffn0[2] = wOff[4];
    wOffn0[3] = wOff[3]; wOffn0[4] = wOff[4]; wOffn0[5] = wOff[4];
    wOffn0[6] = wOff[6]; wOffn0[7] = wOff[7]; wOffn0[8] = wOff[7];
    // i=ncols, j=*
    var wOffnx = [];
    wOffnx[0] = wOff[0]; wOffnx[1] = wOff[1]; wOffnx[2] = wOff[1];
    wOffnx[3] = wOff[3]; wOffnx[4] = wOff[4]; wOffnx[5] = wOff[4];
    wOffnx[6] = wOff[6]; wOffnx[7] = wOff[7]; wOffnx[8] = wOff[7];
    // i=ncols, j=nrows
    var wOffnn = [];
    wOffnn[0] = wOff[0]; wOffnn[1] = wOff[1]; wOffnn[2] = wOff[1];
    wOffnn[3] = wOff[3]; wOffnn[4] = wOff[4]; wOffnn[5] = wOff[4];
    wOffnn[6] = wOff[3]; wOffnn[7] = wOff[4]; wOffnn[8] = wOff[4];
    
    // restore indent for rest of method
    /*jshint indent:4 */

    // loop vars
    var pixelOffset = 0;
    var newValue = 0;
    var wOffFinal = [];
    // go through the destination image pixels
    for (var c=0; c<ncomp; c++) {
        // special component offset
        pixelOffset = c * componentOffset;
        for (var k=0; k<nslices; k++) {
            for (var j=0; j<nrows; j++) {
                for (var i=0; i<ncols; i++) {
                    wOffFinal = wOff;
                    // special border cases
                    if( i === 0 && j === 0 ) {
                        wOffFinal = wOff00;
                    }
                    else if( i === 0 && j === (nrows-1)  ) {
                        wOffFinal = wOff0n;
                    }
                    else if( i === (ncols-1) && j === 0 ) {
                        wOffFinal = wOffn0;
                    }
                    else if( i === (ncols-1) && j === (nrows-1) ) {
                        wOffFinal = wOffnn;
                    }
                    else if( i === 0 && j !== (nrows-1) && j !== 0 ) {
                        wOffFinal = wOff0x;
                    }
                    else if( i === (ncols-1) && j !== (nrows-1) && j !== 0 ) {
                        wOffFinal = wOffnx;
                    }
                    else if( i !== 0 && i !== (ncols-1) && j === 0 ) {
                        wOffFinal = wOffx0;
                    }
                    else if( i !== 0 && i !== (ncols-1) && j === (nrows-1) ) {
                        wOffFinal = wOffxn;
                    }
                        
                    // calculate the weighed sum of the source image pixels that
                    // fall under the convolution matrix
                    newValue = 0;
                    for( var wi=0; wi<9; ++wi )
                    {
                        newValue += this.getValueAtOffset(pixelOffset + wOffFinal[wi]) * weights[wi];
                    }
                    newBuffer[pixelOffset] = newValue;
                    // increment pixel offset
                    pixelOffset += factor;
                }
            }
        }
    }
    return newImage;
};

/**
 * Transform an image using a specific operator.
 * @method transform
 * @param {Function} operator The operator to use when transforming.
 * @return {Image} The transformed image.
 * Note: Uses the raw buffer values.
 */
dwv.image.Image.prototype.transform = function(operator)
{
    var newImage = this.clone();
    var newBuffer = newImage.getBuffer();
    for( var i=0; i < newBuffer.length; ++i )
    {   
        newBuffer[i] = operator( newImage.getValueAtOffset(i) );
    }
    return newImage;
};

/**
 * Compose this image with another one and using a specific operator.
 * @method compose
 * @param {Image} rhs The image to compose with.
 * @param {Function} operator The operator to use when composing.
 * @return {Image} The composed image.
 * Note: Uses the raw buffer values.
 */
dwv.image.Image.prototype.compose = function(rhs, operator)
{
    var newImage = this.clone();
    var newBuffer = newImage.getBuffer();
    for( var i=0; i < newBuffer.length; ++i )
    {   
        // using the operator on the local buffer, i.e. the latest (not original) data
        newBuffer[i] = Math.floor( operator( this.getValueAtOffset(i), rhs.getValueAtOffset(i) ) );
    }
    return newImage;
};

/**
 * Quantify a line according to image information.
 * @method quantifyLine
 * @param {Object} line The line to quantify.
 * @return {Object} A quantification object.
 */
dwv.image.Image.prototype.quantifyLine = function(line)
{
    var length = line.getWorldLength( this.getSpacing().getColumnSpacing(), 
            this.getSpacing().getRowSpacing());
    return {"length": length};
};

/**
 * Quantify a rectangle according to image information.
 * @method quantifyRect
 * @param {Object} rect The rectangle to quantify.
 * @return {Object} A quantification object.
 */
dwv.image.Image.prototype.quantifyRect = function(rect)
{
    var surface = rect.getWorldSurface( this.getSpacing().getColumnSpacing(), 
            this.getSpacing().getRowSpacing());
    var subBuffer = [];
    var minJ = parseInt(rect.getBegin().getY(), 10);
    var maxJ = parseInt(rect.getEnd().getY(), 10);
    var minI = parseInt(rect.getBegin().getX(), 10);
    var maxI = parseInt(rect.getEnd().getX(), 10);
    for ( var j = minJ; j < maxJ; ++j ) {
        for ( var i = minI; i < maxI; ++i ) {
            subBuffer.push( this.getValue(i,j,0) );
        }
    }
    var quantif = dwv.math.getStats( subBuffer );
    return {"surface": surface, "min": quantif.min, 'max': quantif.max,
        "mean": quantif.mean, 'stdDev': quantif.stdDev};
};

/**
 * Quantify an ellipse according to image information.
 * @method quantifyEllipse
 * @param {Object} ellipse The ellipse to quantify.
 * @return {Object} A quantification object.
 */
dwv.image.Image.prototype.quantifyEllipse = function(ellipse)
{
    var surface = ellipse.getWorldSurface( this.getSpacing().getColumnSpacing(), 
            this.getSpacing().getRowSpacing());
    return {"surface": surface};
};

/** 
 * Image module.
 * @module image
 */
var dwv = dwv || {};
dwv.image = dwv.image || {};
dwv.image.lut = dwv.image.lut || {};

/**
 * Rescale LUT class.
 * @class Rescale
 * @namespace dwv.image.lut
 * @constructor
 * @param {Number} slope_ The rescale slope.
 * @param {Number} intercept_ The rescale intercept.
 */
dwv.image.lut.Rescale = function(slope_,intercept_)
{
    /**
     * The internal array.
     * @property rescaleLut_
     * @private
     * @type Array
     */
    var rescaleLut_ = null;
    
    // Check the rescale slope.
    if(typeof(slope_) === 'undefined') {
        slope_ = 1;
    }
    // Check the rescale intercept.
    if(typeof(intercept_) === 'undefined') {
        intercept_ = 0;
    }
    
    /**
     * Get the rescale slope.
     * @method getSlope
     * @return {Number} The rescale slope.
     */ 
    this.getSlope = function() { return slope_; };
    /**
     * Get the rescale intercept.
     * @method getIntercept
     * @return {Number} The rescale intercept.
     */ 
    this.getIntercept = function() { return intercept_; };
    
    /**
     * Initialise the LUT.
     * @method initialise
     * @param {Number} bitsStored The number of bits used to store the data.
     */ 
    // Initialise the LUT.
    this.initialise = function(bitsStored)
    {
        var size = Math.pow(2, bitsStored);
        rescaleLut_ = new Float32Array(size);
        for(var i=0; i<size; ++i) {
            rescaleLut_[i] = i * slope_ + intercept_;
        }
    };
    
    /**
     * Get the length of the LUT array.
     * @method getLength
     * @return {Number} The length of the LUT array.
     */ 
    this.getLength = function() { return rescaleLut_.length; };
    
    /**
     * Get the value of the LUT at the given offset.
     * @method getValue
     * @return {Number} The value of the LUT at the given offset.
     */ 
    this.getValue = function(offset) { return rescaleLut_[offset]; };
};

/**
 * Window LUT class.
 * @class Window
 * @namespace dwv.image.lut
 * @constructor
 * @param {Number} rescaleLut_ The associated rescale LUT.
 * @param {Boolean} isSigned_ Flag to know if the data is signed.
 */
dwv.image.lut.Window = function(rescaleLut_, isSigned_)
{
    /**
     * The internal array: Uint8ClampedArray clamps between 0 and 255.
     * (not supported on travis yet... using basic array, be sure not to overflow!)
     * @property rescaleLut_
     * @private
     * @type Array
     */
    var windowLut_ = null;
    
    // check Uint8ClampedArray support
    if( !dwv.browser.hasClampedArray() ) {
        windowLut_ = new Uint8Array(rescaleLut_.getLength());
    }
    else {
        windowLut_ = new Uint8ClampedArray(rescaleLut_.getLength());
    }
    
    /**
     * The window center.
     * @property center_
     * @private
     * @type Number
     */
    var center_ = null;
    /**
     * The window width.
     * @property width_
     * @private
     * @type Number
     */
    var width_ = null;
    
    /**
     * Get the window center.
     * @method getCenter
     * @return {Number} The window center.
     */ 
    this.getCenter = function() { return center_; };
    /**
     * Get the window width.
     * @method getWidth
     * @return {Number} The window width.
     */ 
    this.getWidth = function() { return width_; };
    /**
     * Get the signed flag.
     * @method isSigned
     * @return {Boolean} The signed flag.
     */ 
    this.isSigned = function() { return isSigned_; };
    
    /**
     * Set the window center and width.
     * @method setCenterAndWidth
     * @param {Number} center The window center.
     * @param {Number} width The window width.
     */ 
    this.setCenterAndWidth = function(center, width)
    {
        // store the window values
        center_ = center;
        width_ = width;
        // pre calculate loop values
        var size = windowLut_.length;
        var center0 = center - 0.5;
        if ( isSigned_ ) {
            center0 += rescaleLut_.getValue( parseInt(size / 2, 10) );
        }
        var width0 = width - 1;
        var dispval = 0;
        if( !dwv.browser.hasClampedArray() )
        {
            var yMax = 255;
            var yMin = 0;
            for(var j=0; j<size; ++j)
            {
                // from the DICOM specification (https://www.dabsoft.ch/dicom/3/C.11.2.1.2/)
                // y = ((x - (c - 0.5)) / (w-1) + 0.5) * (ymax - ymin )+ ymin
                dispval = ((rescaleLut_.getValue(j) - center0 ) / width0 + 0.5) * 255;
                dispval = parseInt(dispval, 10);
                if ( dispval <= yMin ) {
                    windowLut_[j] = yMin;
                }
                else if ( dispval > yMax ) {
                    windowLut_[j] = yMax;
                }
                else {
                    windowLut_[j] = dispval;
                }
            }
        }
        else
        {
            // when using Uint8ClampedArray, values are clamped between 0 and 255
            // no need to check
            for(var i=0; i<size; ++i)
            {
                // from the DICOM specification (https://www.dabsoft.ch/dicom/3/C.11.2.1.2/)
                // y = ((x - (c - 0.5)) / (w-1) + 0.5) * (ymax - ymin )+ ymin
                dispval = ((rescaleLut_.getValue(i) - center0 ) / width0 + 0.5) * 255;
                windowLut_[i]= parseInt(dispval, 10);
            }
        }
    };
    
    /**
     * Get the length of the LUT array.
     * @method getLength
     * @return {Number} The length of the LUT array.
     */ 
    this.getLength = function() { return windowLut_.length; };

    /**
     * Get the value of the LUT at the given offset.
     * @method getValue
     * @return {Number} The value of the LUT at the given offset.
     */ 
    this.getValue = function(offset)
    {
        var shift = isSigned_ ? windowLut_.length / 2 : 0;
        return windowLut_[offset+shift];
    };
};

/**
* Lookup tables for image color display. 
*/

dwv.image.lut.range_max = 256;

dwv.image.lut.buildLut = function(func)
{
    var lut = [];
    for( var i=0; i<dwv.image.lut.range_max; ++i ) {
        lut.push(func(i));
    }
    return lut;
};

dwv.image.lut.max = function(/*i*/)
{
    return dwv.image.lut.range_max-1;
};

dwv.image.lut.maxFirstThird = function(i)
{
    if( i < dwv.image.lut.range_max/3 ) {
        return dwv.image.lut.range_max-1;
    }
    return 0;
};

dwv.image.lut.maxSecondThird = function(i)
{
    var third = dwv.image.lut.range_max/3;
    if( i >= third && i < 2*third ) {
        return dwv.image.lut.range_max-1;
    }
    return 0;
};

dwv.image.lut.maxThirdThird = function(i)
{
    if( i >= 2*dwv.image.lut.range_max/3 ) {
        return dwv.image.lut.range_max-1;
    }
    return 0;
};

dwv.image.lut.toMaxFirstThird = function(i)
{
    var val = i * 3;
    if( val > dwv.image.lut.range_max-1 ) {
        return dwv.image.lut.range_max-1;
    }
    return val;
};

dwv.image.lut.toMaxSecondThird = function(i)
{
    var third = dwv.image.lut.range_max/3;
    var val = 0;
    if( i >= third ) {
        val = (i-third) * 3;
        if( val > dwv.image.lut.range_max-1 ) {
            return dwv.image.lut.range_max-1;
        }
    }
    return val;
};

dwv.image.lut.toMaxThirdThird = function(i)
{
    var third = dwv.image.lut.range_max/3;
    var val = 0;
    if( i >= 2*third ) {
        val = (i-2*third) * 3;
        if( val > dwv.image.lut.range_max-1 ) {
            return dwv.image.lut.range_max-1;
        }
    }
    return val;
};

dwv.image.lut.zero = function(/*i*/)
{
    return 0;
};

dwv.image.lut.id = function(i)
{
    return i;
};

dwv.image.lut.invId = function(i)
{
    return (dwv.image.lut.range_max-1)-i;
};

// plain
dwv.image.lut.plain = {
    "red":   dwv.image.lut.buildLut(dwv.image.lut.id),
    "green": dwv.image.lut.buildLut(dwv.image.lut.id),
    "blue":  dwv.image.lut.buildLut(dwv.image.lut.id)
};

// inverse plain
dwv.image.lut.invPlain = {
    "red":   dwv.image.lut.buildLut(dwv.image.lut.invId),
    "green": dwv.image.lut.buildLut(dwv.image.lut.invId),
    "blue":  dwv.image.lut.buildLut(dwv.image.lut.invId)
};

//rainbow 
dwv.image.lut.rainbow = {
    "blue":  [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 148, 152, 156, 160, 164, 168, 172, 176, 180, 184, 188, 192, 196, 200, 204, 208, 212, 216, 220, 224, 228, 232, 236, 240, 244, 248, 252, 255, 247, 239, 231, 223, 215, 207, 199, 191, 183, 175, 167, 159, 151, 143, 135, 127, 119, 111, 103, 95, 87, 79, 71, 63, 55, 47, 39, 31, 23, 15, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    "green": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128, 136, 144, 152, 160, 168, 176, 184, 192, 200, 208, 216, 224, 232, 240, 248, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 253, 251, 249, 247, 245, 243, 241, 239, 237, 235, 233, 231, 229, 227, 225, 223, 221, 219, 217, 215, 213, 211, 209, 207, 205, 203, 201, 199, 197, 195, 193, 192, 189, 186, 183, 180, 177, 174, 171, 168, 165, 162, 159, 156, 153, 150, 147, 144, 141, 138, 135, 132, 129, 126, 123, 120, 117, 114, 111, 108, 105, 102, 99, 96, 93, 90, 87, 84, 81, 78, 75, 72, 69, 66, 63, 60, 57, 54, 51, 48, 45, 42, 39, 36, 33, 30, 27, 24, 21, 18, 15, 12, 9, 6, 3],
    "red":   [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 62, 60, 58, 56, 54, 52, 50, 48, 46, 44, 42, 40, 38, 36, 34, 32, 30, 28, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144, 148, 152, 156, 160, 164, 168, 172, 176, 180, 184, 188, 192, 196, 200, 204, 208, 212, 216, 220, 224, 228, 232, 236, 240, 244, 248, 252, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]
};

// hot
dwv.image.lut.hot = {
    "red":   dwv.image.lut.buildLut(dwv.image.lut.toMaxFirstThird),
    "green": dwv.image.lut.buildLut(dwv.image.lut.toMaxSecondThird),
    "blue":  dwv.image.lut.buildLut(dwv.image.lut.toMaxThirdThird)
};

// test
dwv.image.lut.test = {
    "red":   dwv.image.lut.buildLut(dwv.image.lut.id),
    "green": dwv.image.lut.buildLut(dwv.image.lut.zero),
    "blue":  dwv.image.lut.buildLut(dwv.image.lut.zero)
};

//red
/*dwv.image.lut.red = {
   "red":   dwv.image.lut.buildLut(dwv.image.lut.max),
   "green": dwv.image.lut.buildLut(dwv.image.lut.id),
   "blue":  dwv.image.lut.buildLut(dwv.image.lut.id)
};*/


/** 
 * Image module.
 * @module image
 */
var dwv = dwv || {};
dwv.image = dwv.image || {};

/**
 * View class.
 * @class View
 * @namespace dwv.image
 * @constructor
 * @param {Image} image The associated image.
 * @param {Boolean} isSigned Is the data signed.
 * Need to set the window lookup table once created
 * (either directly or with helper methods). 
 */
dwv.image.View = function(image, isSigned)
{
    /**
     * Rescale lookup table.
     * @property rescaleLut
     * @private
     * @type Rescale
     */
    var rescaleLut = new dwv.image.lut.Rescale(
        image.getRescaleSlope(), image.getRescaleIntercept() );
    // initialise it
    rescaleLut.initialise(image.getMeta().BitsStored);
    
    /**
     * Window lookup table.
     * @property windowLut
     * @private
     * @type Window
     */
    var windowLut = new dwv.image.lut.Window(rescaleLut, isSigned);
    
    /**
     * Window presets.
     * @property windowPresets
     * @private
     * @type Object
     */
    var windowPresets = null;
    /**
     * Color map
     * @property colorMap
     * @private
     * @type Object
     */
    var colorMap = dwv.image.lut.plain;
    /**
     * Current position
     * @property currentPosition
     * @private
     * @type Object
     */
    var currentPosition = {"i":0,"j":0,"k":0};
    
    /**
     * Get the associated image.
     * @method getImage
     * @return {Image} The associated image.
     */ 
    this.getImage = function() { return image; };
    /**
     * Set the associated image.
     * @method setImage
     * @param {Image} inImage The associated image.
     */ 
    this.setImage = function(inImage) { image = inImage; };
    
    /**
     * Get the rescale LUT of the image.
     * @method getRescaleLut
     * @return {Rescale} The rescale LUT of the image.
     */ 
    this.getRescaleLut = function() { return rescaleLut; };
    /**
     * Set the rescale LUT of the image.
     * @method setRescaleLut
     * @param {Rescale} lut The rescale LUT of the image.
     */ 
    this.setRescaleLut = function(lut) { rescaleLut = lut; };

    /**
     * Get the window LUT of the image.
     * @method getWindowLut
     * @return {Window} The window LUT of the image.
     */ 
    this.getWindowLut = function() { return windowLut; };
    /**
     * Set the window LUT of the image.
     * @method setWindowLut
     * @param {Window} lut The window LUT of the image.
     */ 
    this.setWindowLut = function(lut) { windowLut = lut; };
    
    /**
     * Get the window presets.
     * @method getWindowPresets
     * @return {Object} The window presets.
     */ 
    this.getWindowPresets = function() { return windowPresets; };
    /**
     * Set the window presets.
     * @method setWindowPresets
     * @param {Object} presets The window presets.
     */ 
    this.setWindowPresets = function(presets) { 
        windowPresets = presets;
        this.setWindowLevel(presets[0].center, presets[0].width);
    };
    
    /**
     * Get the color map of the image.
     * @method getColorMap
     * @return {Object} The color map of the image.
     */ 
    this.getColorMap = function() { return colorMap; };
    /**
     * Set the color map of the image.
     * @method setColorMap
     * @param {Object} map The color map of the image.
     */ 
    this.setColorMap = function(map) { 
        colorMap = map;
        // TODO Better handle this...
        if( this.getImage().getPhotometricInterpretation() === "MONOCHROME1") {
            colorMap = dwv.image.lut.invPlain;
        }
        this.fireEvent({"type": "colorchange", 
           "wc": this.getWindowLut().getCenter(),
           "ww": this.getWindowLut().getWidth() });
    };
    
    /**
     * Is the data signed data.
     * @method isSigned
     * @return {Boolean} The signed data flag.
     */ 
    this.isSigned = function() { return isSigned; };
    
    /**
     * Get the current position.
     * @method getCurrentPosition
     * @return {Object} The current position.
     */ 
    this.getCurrentPosition = function() { return currentPosition; };
    /**
     * Set the current position. Returns false if not in bounds.
     * @method setCurrentPosition
     * @param {Object} pos The current position.
     */ 
    this.setCurrentPosition = function(pos) { 
        if( !image.getSize().isInBounds(pos.i,pos.j,pos.k) ) {
            return false;
        }
        var oldPosition = currentPosition;
        currentPosition = pos;
        // only display value for monochrome data
        if( app.getImage().getPhotometricInterpretation().match(/MONOCHROME/) !== null )
        {
            this.fireEvent({"type": "positionchange", 
                "i": pos.i, "j": pos.j, "k": pos.k,
                "value": image.getRescaledValue(pos.i,pos.j,pos.k)});
        }
        else
        {
            this.fireEvent({"type": "positionchange", 
                "i": pos.i, "j": pos.j, "k": pos.k});
        }
        // slice change event (used to trigger redraw)
        if( oldPosition.k !== currentPosition.k ) {
            this.fireEvent({"type": "slicechange"});
        }
        return true;
    };
    
    /**
     * View listeners
     * @property listeners
     * @private
     * @type Object
     */
    var listeners = {};
    /**
     * Get the view listeners.
     * @method getListeners
     * @return {Object} The view listeners.
     */ 
    this.getListeners = function() { return listeners; };
    /**
     * Set the view listeners.
     * @method setListeners
     * @param {Object} list The view listeners.
     */ 
    this.setListeners = function(list) { listeners = list; };
};

/**
 * Set the view window/level.
 * @method setWindowLevel
 * @param {Number} center The window center.
 * @param {Number} width The window width.
 * Warning: uses the latest set rescale LUT or the default linear one.
 */
dwv.image.View.prototype.setWindowLevel = function( center, width )
{
    this.getWindowLut().setCenterAndWidth(center, width);
    this.fireEvent({"type": "wlchange", "wc": center, "ww": width });
};

/**
 * Set the image window/level to cover the full data range.
 * @method setWindowLevelMinMax
 * Warning: uses the latest set rescale LUT or the default linear one.
 */
dwv.image.View.prototype.setWindowLevelMinMax = function()
{
    // calculate center and width
    var range = this.getImage().getRescaledDataRange();
    var min = range.min;
    var max = range.max;
    var width = max - min;
    var center = min + width/2;
    // set window level
    this.setWindowLevel(center,width);
};
/**
 * Go to first slice .
 * @method goFirstSlice
 * @return {Boolean} False if not in bounds.
 */
dwv.image.View.prototype.goFirstSlice = function()
{
    return this.setCurrentPosition({
        "i": this.getCurrentPosition().i,
        "j": this.getCurrentPosition().j,
        "k":  0 
    });
};
/**
 * Increment the current slice number.
 * @method incrementSliceNb
 * @return {Boolean} False if not in bounds.
 */
dwv.image.View.prototype.incrementSliceNb = function()
{
    return this.setCurrentPosition({
        "i": this.getCurrentPosition().i,
        "j": this.getCurrentPosition().j,
        "k": this.getCurrentPosition().k + 1 
    });
};

/**
 * Decrement the current slice number.
 * @method decrementSliceNb
 * @return {Boolean} False if not in bounds.
 */
dwv.image.View.prototype.decrementSliceNb = function()
{
    return this.setCurrentPosition({
        "i": this.getCurrentPosition().i,
        "j": this.getCurrentPosition().j,
        "k": this.getCurrentPosition().k - 1 
    });
};

/**
 * Clone the image using all meta data and the original data buffer.
 * @method clone
 * @return {View} A full copy of this {dwv.image.Image}.
 */
dwv.image.View.prototype.clone = function()
{
    var copy = new dwv.image.View(this.getImage());
    copy.setRescaleLut(this.getRescaleLut());
    copy.setWindowLut(this.getWindowLut());
    copy.setListeners(this.getListeners());
    return copy;
};

/**
 * Generate display image data to be given to a canvas.
 * @method generateImageData
 * @param {Array} array The array to fill in.
 * @param {Number} sliceNumber The slice position.
 */
dwv.image.View.prototype.generateImageData = function( array )
{        
    var sliceNumber = this.getCurrentPosition().k;
    var image = this.getImage();
    var pxValue = 0;
    var photoInterpretation = image.getPhotometricInterpretation();
    var planarConfig = image.getPlanarConfiguration();
    var windowLut = this.getWindowLut();
    var colorMap = this.getColorMap();
    var index = 0;
    var sliceSize = 0;
    var sliceOffset = 0;
    switch (photoInterpretation)
    {
    case "MONOCHROME1":
    case "MONOCHROME2":
        sliceSize = image.getSize().getSliceSize();
        sliceOffset = (sliceNumber || 0) * sliceSize;
        var iMax = sliceOffset + sliceSize;
        for(var i=sliceOffset; i < iMax; ++i)
        {        
            pxValue = parseInt( windowLut.getValue( 
                    image.getValueAtOffset(i) ), 10 );
            array.data[index] = colorMap.red[pxValue];
            array.data[index+1] = colorMap.green[pxValue];
            array.data[index+2] = colorMap.blue[pxValue];
            array.data[index+3] = 0xff;
            index += 4;
        }
        break;
    
    case "RGB":
        // the planar configuration defines the memory layout
        if( planarConfig !== 0 && planarConfig !== 1 ) {
            throw new Error("Unsupported planar configuration: "+planarConfig);
        }
        sliceSize = image.getSize().getSliceSize();
        sliceOffset = (sliceNumber || 0) * 3 * sliceSize;
        // default: RGBRGBRGBRGB...
        var posR = sliceOffset;
        var posG = sliceOffset + 1;
        var posB = sliceOffset + 2;
        var stepPos = 3;
        // RRRR...GGGG...BBBB...
        if (planarConfig === 1) { 
            posR = sliceOffset;
            posG = sliceOffset + sliceSize;
            posB = sliceOffset + 2 * sliceSize;
            stepPos = 1;
        }
        
        var redValue = 0;
        var greenValue = 0;
        var blueValue = 0;
        for(var j=0; j < image.getSize().getSliceSize(); ++j)
        {        
            redValue = parseInt( windowLut.getValue( 
                    image.getValueAtOffset(posR) ), 10 );
            greenValue = parseInt( windowLut.getValue( 
                    image.getValueAtOffset(posG) ), 10 );
            blueValue = parseInt( windowLut.getValue( 
                    image.getValueAtOffset(posB) ), 10 );
            
            array.data[index] = redValue;
            array.data[index+1] = greenValue;
            array.data[index+2] = blueValue;
            array.data[index+3] = 0xff;
            index += 4;
            
            posR += stepPos;
            posG += stepPos;
            posB += stepPos;
        }
        break;
    
    default: 
        throw new Error("Unsupported photometric interpretation: "+photoInterpretation);
    }
};

/**
 * Add an event listener on the view.
 * @method addEventListener
 * @param {String} type The event type.
 * @param {Object} listener The method associated with the provided event type.
 */
dwv.image.View.prototype.addEventListener = function(type, listener)
{
    var listeners = this.getListeners();
    if( !listeners[type] ) {
        listeners[type] = [];
    }
    listeners[type].push(listener);
};

/**
 * Remove an event listener on the view.
 * @method removeEventListener
 * @param {String} type The event type.
 * @param {Object} listener The method associated with the provided event type.
 */
dwv.image.View.prototype.removeEventListener = function(type, listener)
{
    var listeners = this.getListeners();
    if( !listeners[type] ) {
        return;
    }
    for(var i=0; i < listeners[type].length; ++i)
    {   
        if( listeners[type][i] === listener ) {
            listeners[type].splice(i,1);
        }
    }
};

/**
 * Fire an event: call all associated listeners.
 * @method fireEvent
 * @param {Object} event The event to fire.
 */
dwv.image.View.prototype.fireEvent = function(event)
{
    var listeners = this.getListeners();
    if( !listeners[event.type] ) {
        return;
    }
    for(var i=0; i < listeners[event.type].length; ++i)
    {   
        listeners[event.type][i](event);
    }
};

/** 
 * Utility module.
 * @module utils
 */
var dwv = dwv || {};
/**
 * Namespace for utility functions.
 * @class utils
 * @namespace dwv
 * @static
 */
dwv.utils = dwv.utils || {};

/**
 * Capitalise the first letter of a string.
 * @method capitaliseFirstLetter
 * @static
 * @param {String} string The string to capitalise the first letter.
 * @return {String} The new string.
 */
dwv.utils.capitaliseFirstLetter = function (string)
{
    var res = string;
    if ( string ) {
        res = string.charAt(0).toUpperCase() + string.slice(1);
    }
    return res;
};

/**
 * Clean string: trim and remove ending.
 * @method cleanString
 * @static
 * @param {String} string The string to clean.
 * @return {String} The cleaned string.
 */
dwv.utils.cleanString = function (string)
{
    var res = string;
    if ( string ) {
        // trim spaces
        res = string.trim();
        // get rid of ending zero-width space (u200B)
        if ( res[res.length-1] === String.fromCharCode("u200B") ) {
            res = res.substring(0, res.length-1);
        }
    }
    return res;
};

/**
 * Split query string:
 *  'root?key0=val00&key0=val01&key1=val10' returns 
 *  { base : root, query : [ key0 : [val00, val01], key1 : val1 ] }
 * Returns an empty object if the input string is not correct (null, empty...)
 *  or if it is not a query string (no question mark).
 * @method splitQueryString
 * @static
 * @param {String} inputStr The string to split.
 * @return {Object} The split string.
 */
dwv.utils.splitQueryString = function (inputStr)
{
    // result
    var result = {};
    // check if query string
    var sepIndex = null;
    if ( inputStr && (sepIndex = inputStr.indexOf('?')) !== -1 ) {
        // base: before the '?'
        result.base = inputStr.substr(0, sepIndex);
        // query : after the '?'
        var query = inputStr.substr(sepIndex + 1);
        // split key/value pairs of the query
        result.query = dwv.utils.splitKeyValueString(query);
    }
    // return
    return result;
};

/**
 * Split key/value string:
 *  key0=val00&key0=val01&key1=val10 returns 
*   { key0 : [val00, val01], key1 : val1 }
 * @method splitKeyValueString
 * @static
 * @param {String} inputStr The string to split.
 * @return {Object} The split string.
 */
dwv.utils.splitKeyValueString = function (inputStr)
{
    // result
    var result = {};
    // check input string
    if ( inputStr ) {
         // split key/value pairs
        var pairs = inputStr.split('&');
        for ( var i = 0; i < pairs.length; ++i )
        {
            var pair = pairs[i].split('=');
            // if the key does not exist, create it
            if ( !result[pair[0]] ) 
            {
                result[pair[0]] = pair[1];
            }
            else
            {
                // make it an array
                if ( !( result[pair[0]] instanceof Array ) ) {
                    result[pair[0]] = [result[pair[0]]];
                }
                result[pair[0]].push(pair[1]);
            }
        }
    }
    return result;
};
