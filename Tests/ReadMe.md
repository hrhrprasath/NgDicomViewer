For UnitTesting:
--------------
	open NgDicomViewer\Tests\Unit\Test.html
	
For E2E testing:
----------------

Requirements:<br>
	&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;You need to install <a href="https://nodejs.org/en/">node js </a> <br>
	&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;install protractor globally [ npm install protractor -g ]<br>
	&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;updated web driver [ webdriver-manager update ]<br>
	
	
step 1: start ng-dicomviewer in local host 

			>open node command prompt
			>cd to NgDicomViewer\Tests\NodeLauncher
			>node app.js
			
			
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;this will start ng-dicomviewer in local host @port 3000
		
step 2: Start web driver 


			>open another node command prompt
			>cd to NgDicomViewer\Tests\E2E
			>webdriver-manager start
	
	
			
step 3 : Start protractor


			>open another node command prompt
			>cd to NgDicomViewer\Tests\E2E
			>protractor conf.js
			


Note: e2e testing uses chrome as the testing browser 
