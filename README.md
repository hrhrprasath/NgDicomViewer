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

<b>Attributes in dicomviewer tag:</b><br>
&emsp;1)<b>fileutilityid</b> : id of input tag of type file to open local dicom file<br>
&emsp;2)<b>urllistid</b> : id of input text for  getting url list separated by ';'<br>
&emsp;3)<b>urlopenbtnid</b> : button id to open images from url in the above<br>
<br>
<b>Scope Variables:</b><br>
&emsp;1)<b>Tool</b> : Object To See available Tool Names which can be used to set them in selecting one<br>
&emsp;&emsp;"Tool.ButtonBasedTools" Returns Available Button based Tool name list <br>
&emsp;&emsp;"Tool.MouseBasedTools" Returns Available Mouse based Tool name list <br>
&emsp;2)<b>SelectedButtonTool</b> : setting the value same as available in list will apply the tool to opened image<br>
&emsp;3)<b>SelectedMouseTool</b> : setting the value same as available in list will apply the tool on mouse operation on the image<br>
&emsp;4)<b>SelectedColor</b> : Any html Colour which can be setted the annotation colour<br>
&emsp;5)<b>Colours</b> : list of recommended colours for the annotation<br>
&emsp;6)<b>PatientName</b> : Opened image PatientName<br>
&emsp;7)<b>PatientId</b> : Opened image PatientId<br>
&emsp;8)<b>WWidth</b> : current Window Width of image<br>
&emsp;9)<b>WCenter</b> : current Window Centre of image<br>
&emsp;10)<b>Rmin,Rmax</b> : min and max value for the threshold filter tool that can be applied on the image<br>
&emsp;11)<b> Tval</b> : Object <br>
&emsp;&emsp;"Tval.min" specify threshold filter tool min to be applied on image<br>
&emsp;&emsp;"Tval.max" specify threshold filter tool max to be applied on image<br>
  <br>
&emsp;For more Details see Example.html

Source project
=============
<ul>
<li><a href="https://github.com/ivmartel/dwv">Dwv</a></li>
<li><a href="https://github.com/angular/angular.js">anngular js</a></li>
</ul>

<br>
Released under <a href="https://github.com/hrhrprasath/NgDicomViewer/blob/master/LICENSE.txt">MIT licence</a>

==========================
<h6 >Declaration<br>
&emsp;This app is not intended for clinical or diagnostic use. Any use of this viewer for diagnosis or in a clinical setting is strongly discouraged and should be avoided. This app is provided “as is” without warranty of any kind, either expressed or implied, including, but not limited to, the implied warranties of merchantability, fitness for a particular purpose, or non-infringement. In no event, shall author is liable for any special, incidental, indirect or consequential damages of any kind, or any damages whatsoever resulting from the use of this app, data or technical information accessed and viewed with this app, whether or not advised of the possibility of damage, under any theory of liability, arising out of or in connection with the use or performance of this app.
</h6>
