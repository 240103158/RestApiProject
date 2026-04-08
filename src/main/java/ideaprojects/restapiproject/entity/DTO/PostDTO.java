package ideaprojects.restapiproject.entity.DTO;

import ideaprojects.restapiproject.entity.User;

import java.time.LocalDate;

public class PostDTO {
    private int id;
    private String author;
    private String title;
    private LocalDate createdDate;
    private int numberOfLikes;
    private int numberOfDislikes;

    public PostDTO(int id, String author, String title, LocalDate createdDate, int numberOfLikes, int numberOfDislikes) {
        this.id = id;
        this.author = author;
        this.title = title;
        this.createdDate = createdDate;
        this.numberOfLikes = numberOfLikes;
        this.numberOfDislikes = numberOfDislikes;
    }

    public int getId() {
        return id;
    }

    public String getAuthor() {
        return author;
    }

    public String getTitle() {
        return title;
    }

    public LocalDate getCreatedDate() {
        return createdDate;
    }

    public int getNumberOfLikes() {
        return numberOfLikes;
    }

    public int getNumberOfDislikes() {
        return numberOfDislikes;
    }
}
