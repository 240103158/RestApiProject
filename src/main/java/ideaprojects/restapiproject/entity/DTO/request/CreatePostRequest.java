package ideaprojects.restapiproject.entity.DTO.request;

import ideaprojects.restapiproject.entity.Post;

import java.time.LocalDateTime;

public class CreatePostRequest {
    private String author;
    private String title;

    public CreatePostRequest(String author, String title) {
        this.author = author;
        this.title = title;
    }

    public Post toEntity(){
        return   new Post(
                author,
                title,
                LocalDateTime.now(),
                0,
                0
        );
    }
}
