package ideaprojects.restapiproject.entity.DTO.request;

import ideaprojects.restapiproject.entity.Post;
import ideaprojects.restapiproject.entity.User;

import java.time.LocalDateTime;

public class CreatePostRequest {
    private String title;

    public CreatePostRequest( String title) {
        this.title = title;
    }


//    public CreatePostRequest() {
//    }

    public Post toEntity(User author){
        return  new Post(
                author,
                title,
                LocalDateTime.now(),
                0,
                0
        );
    }

    public String getTitle() {
        return title;
    }

//    public void setTitle(String title) {
//        this.title = title;
//    }
}
