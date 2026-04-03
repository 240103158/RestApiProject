package ideaprojects.restapiproject.Service;

import ideaprojects.restapiproject.entity.DTO.PostContainerDTO;
import ideaprojects.restapiproject.entity.DTO.PostDTO;
import ideaprojects.restapiproject.entity.DTO.request.CreatePostRequest;
import ideaprojects.restapiproject.entity.DTO.request.UpdatePostRequest;
import ideaprojects.restapiproject.entity.Post;
import ideaprojects.restapiproject.entity.User;
import ideaprojects.restapiproject.repository.PostRepository;
import ideaprojects.restapiproject.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;


@Service
@Transactional
public class PostService {
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Autowired
    public PostService(PostRepository postRepository, UserRepository userRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
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
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Post post = createPostRequest.toEntity(author);
        return postRepository.save(post).toDTO();
    }
    public PostDTO update(UpdatePostRequest updatePostRequest, int id){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Post post = postRepository.findById(id)
                .orElseThrow(() ->new IllegalArgumentException("Post not found with id: "+ id));

        post.setTitle(updatePostRequest.getTitle());
        post.setAuthor(author);
        post.setCreatedDate(post.getCreatedDate());
        post.setNumberOfDislikes(updatePostRequest.getNumberOfDislikes());
        post.setNumberOfLikes(updatePostRequest.getNumberOfLikes());

        return postRepository.save(post).toDTO();
    }

    public void delete(int id){
        postRepository.deleteById(id);
    }

}
