package ideaprojects.restapiproject.controller.exception;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Throwable.class)
    public ResponseEntity<ExceptionResponse> handler(Throwable throwable){
        HttpStatus status = HttpStatus.UNPROCESSABLE_ENTITY;
        ExceptionResponse exceptionResponse  = new ExceptionResponse(status.value(), throwable.getMessage());

        return new ResponseEntity<>(exceptionResponse, buildHeader(), status);
    }

    private HttpHeaders buildHeader(){
        HttpHeaders headers  = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }
}
