package ideaprojects.restapiproject.controller.exception;

import java.time.LocalDateTime;

public class ExceptionResponse {
    private final int status;
    private final String message;
    private final LocalDateTime time;

    public ExceptionResponse(int status, String message) {
        this.status = status;
        this.message = message;
        this.time = LocalDateTime.now();
    }

    public int getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }

    public LocalDateTime getTime() {
        return time;
    }
}
