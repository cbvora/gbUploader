function gbUpload () {

	
	this.settings = {
	
		'inputField': 'gbUploadFile',

		'formId': 'gbUploadForm',

		
		'progressBarField': 'gbUploadProgressBarFilled',

		
		'timeRemainingField': 'gbUploadTimeRemaining',

		
		'responseField': 'gbUploadResponse',

		
		'submitButton': 'gbUploadSubmit',

		
		'progressBarColor': '#5bb75b',

		
		'progressBarColorError': '#da4f49',

		'scriptPath': 'inc/gbUpload.php',

		'scriptPathParams': '',

	
		'chunkSize': 1000000,

		
		'maxFileSize': 2147483648
	};

	
	this.uploadData = {
		'uploadStarted': false,
		'file': false,
		'numberOfChunks': 0,
		'aborted': false,
		'paused': false,
		'pauseChunk': 0,
		'key': 0,
		'timeStart': 0,
		'totalTime': 0
	};

	this.success = function(response) {

	};

	parent = this;

	this.$ = function(id) {
		return document.getElementById(id);
	};

	this.resetKey = function() {
			this.uploadData = {
				'uploadStarted': false,
				'file': false,
				'numberOfChunks': 0,
				'aborted': false,
				'paused': false,
				'pauseChunk': 0,
				'key': 0,
				'timeStart': 0,
				'totalTime': 0
			};
		};

	this.fire = function() {
		if(this.uploadData.uploadStarted === true && this.uploadData.paused === false) {
			this.pauseUpload();
		}
		else if(this.uploadData.uploadStarted === true && this.uploadData.paused === true) {
			this.resumeUpload();
		}
		else {
			this.processFiles();
		}

	};

	this.processFiles = function() {

		if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
			this.$(this.settings.formId).submit();
			return;
		}

		this.resetKey();
		this.uploadData.uploadStarted = true;

		
		this.$(this.settings.progressBarField).style.backgroundColor = this.settings.progressBarColor;
		this.$(this.settings.responseField).textContent = 'Uploading...';
		this.$(this.settings.submitButton).value = 'Pause';

		this.uploadData.file = this.$(this.settings.inputField).files[0];

		
		var fileSize = this.uploadData.file.size;
		if(fileSize > this.settings.maxFileSize) {
			this.printResponse('The file you have chosen is too large.', true);
			return;
		}

		this.uploadData.numberOfChunks = Math.ceil(fileSize / this.settings.chunkSize);

		this.sendFile(0);
	};

	this.sendFile = function (chunk) {

		this.uploadData.timeStart = new Date().getTime();

		if(this.uploadData.aborted === true) {
			return;
		}

		if(this.uploadData.paused === true) {
			this.uploadData.pauseChunk = chunk;
			this.printResponse('Upload paused.', false);
			return;
		}

		var start = chunk * this.settings.chunkSize;
		var stop = start + this.settings.chunkSize;

		var reader = new FileReader();

		reader.onloadend = function(evt) {

			
			xhr = new XMLHttpRequest();
			xhr.open("POST", parent.settings.scriptPath + '?action=upload&key=' + parent.uploadData.key + parent.settings.scriptPathParams, true);
			xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

			xhr.onreadystatechange = function() {
				if(xhr.readyState == 4) {
					var response = JSON.parse(xhr.response);

					if(response.errorStatus !== 0 || xhr.status != 200) {
						parent.printResponse(response.errorText, true);
						return;
					}

					if(chunk === 0 || parent.uploadData.key === 0) {
						parent.uploadData.key = response.key;
					}

					if(chunk < parent.uploadData.numberOfChunks) {
						parent.progressUpdate(chunk + 1);
						parent.sendFile(chunk + 1);
					}
					else {
						parent.sendFileData();
					}

				}

			};

			xhr.send(blob);
		};

		//Slice the file into the desired chunk
		// core of the script..
		var blob = this.uploadData.file.slice(start, stop);
		reader.readAsBinaryString(blob);
	};

	
	this.sendFileData = function() {
		var data = 'key=' + this.uploadData.key + '&name=' + this.uploadData.file.name;
		xhr = new XMLHttpRequest();
		xhr.open("POST", parent.settings.scriptPath + '?action=finish', true);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

		xhr.onreadystatechange = function() {
				if(xhr.readyState == 4) {
					var response = JSON.parse(xhr.response);

					if(response.errorStatus !== 0 || xhr.status != 200) {
						parent.printResponse(response.errorText, true);
						return;
					}

					parent.resetKey();

					parent.$(parent.settings.submitButton).value = 'Start Upload';
					parent.printResponse('File uploaded successfully.', false);

					parent.success(response);
				}
			};

		xhr.send(data);
	};

	this.abortFileUpload = function() {
		this.uploadData.aborted = true;
		var data = 'key=' + this.uploadData.key;
		xhr = new XMLHttpRequest();
		xhr.open("POST", this.settings.scriptPath + '?action=abort', true);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

		xhr.onreadystatechange = function() {
				if(xhr.readyState == 4) {
					var response = JSON.parse(xhr.response);

					if(response.errorStatus !== 0 || xhr.status != 200) {
						parent.printResponse(response.errorText, true);
						return;
					}
					parent.printResponse('File upload was cancelled.', true);
				}

			};

		xhr.send(data);
	};

	
	this.pauseUpload = function() {
		this.uploadData.paused = true;
		this.printResponse('', false);
		this.$(this.settings.submitButton).value = 'Resume';
	};

	
	this.resumeUpload = function() {
		this.uploadData.paused = false;
		this.$(this.settings.submitButton).value = 'Pause';
		this.sendFile(this.uploadData.pauseChunk);
	};

	
	this.progressUpdate = function(progress) {

		var percent = Math.ceil((progress / this.uploadData.numberOfChunks) * 100);
		this.$(this.settings.progressBarField).style.width = percent + '%';
		this.$(this.settings.progressBarField).textContent = percent + '%';

		if(progress % 5 === 0) {

			this.uploadData.totalTime += (new Date().getTime() - this.uploadData.timeStart);
			console.log(this.uploadData.totalTime);

			var timeLeft = Math.ceil((this.uploadData.totalTime / progress) * (this.uploadData.numberOfChunks - progress) / 100);
			console.log(Math.ceil(((this.uploadData.totalTime / progress) * this.settings.chunkSize) / 1024) + 'kb/s');

			this.$(this.settings.timeRemainingField).textContent = timeLeft + ' seconds remaining';
		}
	};

	this.printResponse = function(responseText, error) {
		this.$(this.settings.responseField).textContent = responseText;
		this.$(this.settings.timeRemainingField).textContent = '';
		if(error === true) {
			this.$(this.settings.progressBarField).style.backgroundColor = this.settings.progressBarColorError;
		}
	};
}