package ideaprojects.restapiproject.entity.DTO;

import java.util.List;

public class PostContainerDTO {
    private final List<PostDTO> posts;

    public PostContainerDTO(List<PostDTO> posts) {
        this.posts = posts;
    }

    public List<PostDTO> getPosts() {
        return posts;
    }
}
