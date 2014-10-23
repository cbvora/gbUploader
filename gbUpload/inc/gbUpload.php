<?php
class gbUpload
{
	// While Chunking , Small pieces will be stored here.
	const TEMP_DIRECTORY = '../files/tmp/';

	//Once download compeleted , All Chunked files will be merged and stored here.
	 const MAIN_DIRECTORY = '../files/';


	const MAX_SIZE = 2147483648;


	private $tempDirectory;


	private $mainDirectory;

// Name of the temporary file. Used as a reference to make sure chunks get written to the right file.
	 	private $tempName;

	 //Constructor function, sets the temporary directory and main directory
	 	public function __construct() {
		$this->setTempDirectory(self::TEMP_DIRECTORY);
		$this->setMainDirectory(self::MAIN_DIRECTORY);
	}

// Create a random file name for the file to use as it's being uploaded
	 	public function setTempName($value = null) {
		if($value) {
			$this->tempName = $value;
		}
		else {
			$this->tempName = mt_rand() . '.tmp';
		}
	}

	// Return the name of the temporary file
	public function getTempName() {
		return $this->tempName;
	}

	 //Set the name of the temporary directory
	 	public function setTempDirectory($value) {
		$this->tempDirectory = $value;
		return true;
	}

// Return the name of the temporary directory
	public function getTempDirectory() {
		return $this->tempDirectory;
	}

	 // Set the name of the main directory
	public function setMainDirectory($value) {
		$this->mainDirectory = $value;
	}

	 // Return the name of the main directory
	public function getMainDirectory() {
		return $this->mainDirectory;
	}

	 // Function to upload the individual file chunks
	public function uploadFile() {

		//Make sure the total file we're writing to hasn't surpassed the file size limit
		if(file_exists($this->getTempDirectory() . $this->getTempName())) {
			if(filesize($this->getTempDirectory() . $this->getTempName()) > self::MAX_SIZE) {
				$this->abortUpload();
				return json_encode(array(
						'errorStatus' => 1,
						'errorText' => 'File is too large.'
					));
			}
		}

		$fileData = file_get_contents('php://input');

		//Merge the actual chunk to the larger file
		$handle = fopen($this->getTempDirectory() . $this->getTempName(), 'a');

		fwrite($handle, $fileData);
		fclose($handle);

		return json_encode(array(
			'key' => $this->getTempName(),
			'errorStatus' => 0
		));
	}

	 // Function for cancelling uploads while they're in-progress; deletes the temp file
	public function abortUpload() {
		if(unlink($this->getTempDirectory() . $this->getTempName())) {
			return json_encode(array('errorStatus' => 0));
		}
		else {

			return json_encode(array(
				'errorStatus' => 1,
				'errorText' => 'Unable to delete temporary file.'
			));
		}
	}

	
	  //Function to rename and move the finished file
	 
	public function finishUpload($finalName) {
		if(rename($this->getTempDirectory() . $this->getTempName(), $this->getMainDirectory() . $finalName)) {
			return json_encode(array('errorStatus' => 0));
		}
		else {
			return json_encode(array(
				'errorStatus' => 1,
				'errorText' => 'Unable to move file after uploading.'
			));
		}
	}

	//Basic php file upload function
	 
	public function postUnsupported() {
		$name = $_FILES['gbUploadFile']['name'];
		$size = $_FILES['gbUploadFile']['size'];
		$tempName = $_FILES['gbUploadFile']['tmp_name'];

		if(filesize($tempName) > self::MAX_SIZE) {
			return 'File is too large.';
		}

		if(move_uploaded_file($tempName, $this->getMainDirectory() . $name)) {
			return 'File uploaded.';
		}
		else {
			return 'There was an error uploading the file';
		}

	}
}

//Instantiate the class
$gbUpload = new gbUpload;

//Set the temporary filename
$tempName = null;
if(isset($_GET['key'])) {
	$tempName = $_GET['key'];
}
if(isset($_POST['key'])) {
	$tempName = $_POST['key'];
}
$gbUpload->setTempName($tempName);

switch($_GET['action']) {
	case 'upload':
		print $gbUpload->uploadFile();
		break;
	case 'abort':
		print $gbUpload->abortUpload();
		break;
	case 'finish':
		print $gbUpload->finishUpload($_POST['name']);
		break;
	case 'post-unsupported':
		print $gbUpload->postUnsupported();
		break;
}
?>