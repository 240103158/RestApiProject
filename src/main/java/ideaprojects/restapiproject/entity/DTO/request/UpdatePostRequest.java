package ideaprojects.restapiproject.entity.DTO.request;

import ideaprojects.restapiproject.entity.Post;
import ideaprojects.restapiproject.entity.User;

import java.time.LocalDateTime;

public class UpdatePostRequest {
    private String title;
    private int numberOfLikes;
    private int numberOfDislikes;

    public UpdatePostRequest(String title, int numberOfLikes, int numberOfDislikes) {
        this.title = title;
        this.numberOfLikes = numberOfLikes;
        this.numberOfDislikes = numberOfDislikes;
    }

    public UpdatePostRequest() {
    }

    public String getTitle() {
        return title;
    }

    public int getNumberOfLikes() {
        return numberOfLikes;
    }

    public int getNumberOfDislikes() {
        return numberOfDislikes;
    }

    public Post toEntity(int id,  LocalDateTime createdDate, User author){
        return new Post(
                author,
                title,
                createdDate,
                numberOfLikes,
                numberOfDislikes
        );
    }
}
