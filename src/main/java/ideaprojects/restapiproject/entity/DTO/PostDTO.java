package ideaprojects.restapiproject.entity.DTO;

import java.time.LocalDate;

public class PostDTO {
    private int id;
    private String author;
    private String title;
    private LocalDate createDate;
    private int numberOfLikes;
    private int numberOfDislikes;

    public PostDTO(int id, String author, String title, LocalDate createDate, int numberOfLikes, int numberOfDislikes) {
        this.id = id;
        this.author = author;
        this.title = title;
        this.createDate = createDate;
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

    public LocalDate getCreateDate() {
        return createDate;
    }

    public int getNumberOfLikes() {
        return numberOfLikes;
    }

    public int getNumberOfDislikes() {
        return numberOfDislikes;
    }
}
