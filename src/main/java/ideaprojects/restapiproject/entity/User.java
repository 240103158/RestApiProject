package ideaprojects.restapiproject.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
public class User {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        @Column(name = "id", nullable = false)
        private int id;

        @Column(name = "name", nullable = false, length = 50)
        private String name;

        @Column(name = "email", nullable = false, length = 50)
        private String email;

        @Column(name = "password", nullable = false, length = 60)
        private String password;

        @Column(name = "posts")
        @OneToMany(mappedBy = "author",  cascade = CascadeType.ALL)
        private List<Post> posts;

        @Column(name = "create_date", nullable = false)
        private LocalDateTime createdDate;

        @Column(name = "role", nullable = false)
        private UserRole role;

        public User() {
        }

    public User(int id, String name, String email, String password, List<Post> posts, LocalDateTime createdDate, UserRole role) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.posts = posts;
        this.createdDate = createdDate;
        this.role = role;
    }

    //creating user


    public User(String name, String email, String password, List<Post> posts, LocalDateTime createdDate, UserRole role) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.posts = posts;
        this.createdDate = createdDate;
        this.role = role;
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public List<Post> getPosts() {
        return posts;
    }

    public LocalDateTime getCreatedDate() {
        return createdDate;
    }

    public UserRole getRole() {
        return role;
    }

    public void setId(int id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPosts(List<Post> posts) {
        this.posts = posts;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }
}
