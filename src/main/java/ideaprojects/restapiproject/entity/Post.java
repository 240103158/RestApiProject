package ideaprojects.restapiproject.entity;

import ideaprojects.restapiproject.entity.DTO.PostDTO;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;

    @Column(name = "author", nullable = false, length = 20)
    private String author;

    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "number_of_likes", nullable = false)
    private int numberOfLikes;

    @Column(name = "number_of_dislikes", nullable = false)
    private int numberOfDislikes;


    public Post() {
    }

    public Post(int id, String author, String title, LocalDateTime createdDate, int numberOfLikes, int numberOfDislikes) {
        this.id = id;
        this.author = author;
        this.title = title;
        this.createdDate = createdDate;
        this.numberOfLikes = numberOfLikes;
        this.numberOfDislikes = numberOfDislikes;
    }

    public Post(String author, String title, LocalDateTime createdDate, int numberOfLikes, int numberOfDislikes) {
        this.author = author;
        this.title = title;
        this.createdDate = createdDate;
        this.numberOfLikes = numberOfLikes;
        this.numberOfDislikes = numberOfDislikes;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }

    public void setNumberOfLikes(int numberOfLikes) {
        this.numberOfLikes = numberOfLikes;
    }

    public void setNumberOfDislikes(int numberOfDislikes) {
        this.numberOfDislikes = numberOfDislikes;
    }

    public int getId() {
        return id;
    }

    public String getAuthor() {
        return author;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
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

    public PostDTO toDTO(){
                    return  new PostDTO(
                            this.id,
                            this.author,
                            this.title,
                            this.createdDate.toLocalDate(),
                            this.numberOfLikes,
                            this.numberOfDislikes
                    );

    }
}
