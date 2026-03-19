package ideaprojects.restapiproject.Service;

import ideaprojects.restapiproject.entity.DTO.PostContainerDTO;
import ideaprojects.restapiproject.entity.DTO.PostDTO;
import ideaprojects.restapiproject.entity.DTO.request.CreatePostRequest;
import ideaprojects.restapiproject.entity.DTO.request.UpdatePostRequest;
import ideaprojects.restapiproject.entity.Post;
import ideaprojects.restapiproject.repository.PostRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;


@Service
@Transactional
public class PostService {
    private final PostRepository postRepository;

    @Autowired
    public PostService(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    public PostContainerDTO findAll(){
        List<PostDTO> posts = postRepository.findAll().stream()
                .map(post -> post.toDTO())
                .collect(Collectors.toList());

        return  new PostContainerDTO(posts);
    }

    public PostDTO findById(int id) {
        return postRepository.findById(id)
                .map(post -> post.toDTO())
                .orElseThrow(() -> new IllegalArgumentException("Post with id = " + id + " not found"));
    }


    public PostDTO save(CreatePostRequest createPostRequest){
        Post post = createPostRequest.toEntity();
        return postRepository.save(post).toDTO();
    }

    public PostDTO update(UpdatePostRequest updatePostRequest, int id){
        return postRepository.findById(id)
                .map(post -> {
                    Post updatedPost = updatePostRequest.toEntity(post.getId(), post.getAuthor(), post.getCreatedDate());
                    return postRepository.save(updatedPost).toDTO();
                })
                .orElseThrow(() -> new IllegalArgumentException("Post with id = " + id + " not found"));
    }

    public void delete(int id){
        postRepository.deleteById(id);
    }

}
