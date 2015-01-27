$(document).ready(function() {
 
    status('Choose some files :)');
 
    // Check to see when a user has selected a file                                                                                                                
    var timerId;
    timerId = setInterval(function() {
	if($('#userPhotoInput').val() !== '') {
            clearInterval(timerId);
 
            $('#uploadForm').submit();
        }
    }, 500);
 
    $('#uploadForm').submit(function() {
        status('uploading the files ...');
 
        $(this).ajaxSubmit({                                                                                                                 
 
            error: function(xhr) {
		status('Error: ' + xhr.status);
            },
 
            success: function(response) {
							status("Success!");
            }
	});
 
	// Have to stop the form from submitting and causing                                                                                                       
	// a page refresh - don't forget this                                                                                                                      
	return false;
    });
 
    function status(message) {
	$('#status').text(message);
    }
});
