NgDicomViewer
===============
NgDicomViewer is an Angular application(Single Page Application) built on top of the open source Javascript / HTML5 libraries provided by the DWV project.
Predominantly made to view DICOM images on HTML 5 canvas on modern browsers without using any windowed plugins. 

Not fully DICOM compliant, see <a href="https://github.com/ivmartel/dwv/wiki/Dicom-Support">Dicom-Support</a> for details

For Demo please <a href="http://hrhrprasath.github.io/NgDicomViewer/demo/ng-DicomViewer.html">click</a>

All coding/implementation contributions and comments are welcome.

Usage
=======
Make sure to load AngularJS first, and then `NgDicomViewer-mini.js`. Also include openjpeg to open jpg compressed image.

The module is named `ngdicomviewer`. To enable it, you must simply list it as a dependency in your app. Example:

    var app = angular.module('app', ['ngdicomviewer', ...]);

You can then use it in your templates like so:

    <html ng-app='app'>
        ...
        <body>
            ...
            <dicomviewer class ="dicom" fileutilityid ="fileinput" urllistid="urltxt" urlopenbtnid="urlbtn">
            </dicomviewer>
        </body>
    </html>

Attributes in dicomviewer tag:<br>
&emsp;1) fileutilityid : id of input tag of type file to open local dicom file<br>
&emsp;2) urllistid : id of input text for  getting url list separated by ';'<br>
&emsp;3) urlopenbtnid : button id to open images from url in the above<br>
<br>
Scope Variables:<br>
&emsp;1) Tool: Object To See available Tool Names which can be used to set them in selecting one<br>
&emsp;&emsp;"Tool.ButtonBasedTools" Returns Available Button based Tool name list <br>
&emsp;&emsp;"Tool.MouseBasedTools" Returns Available Mouse based Tool name list <br>
&emsp;2) SelectedButtonTool : setting the value same as available in list will apply the tool to opened image<br>
&emsp;3) SelectedMouseTool : setting the value same as available in list will apply the tool on mouse operation on the &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;image<br>
&emsp;4) SelectedColor : Any html Colour which can be setted the annotation colour<br>
&emsp;5) Colours: list of recommended colours for the annotation<br>
&emsp;6) PatientName : Opened image PatientName<br>
&emsp;7) PatientId : Opened image PatientId<br>
&emsp;8) WWidth : current Window Width of image<br>
&emsp;9) WCenter : current Window Centre of image<br>
&emsp;10) Rmin,Rmax : min and max value for the threshold filter tool that can be applied on the image<br>
&emsp;11) Tval : Object <br>
&emsp;&emsp;"Tval.min" specify threshold filter tool min to be applied on image<br>
&emsp;&emsp;"Tval.max" specify threshold filter tool max to be applied on image<br>
  <br>
&emsp;For more Details see Example.html

Source project
=============
<ul>
<li><a href="https://github.com/ivmartel/dwv">Dwv</a></li>
<li><a href="https://github.com/angular/angular.js">anngular js</a></li>

