package ideaprojects.restapiproject.controller;

import ideaprojects.restapiproject.entity.DTO.PostContainerDTO;
import ideaprojects.restapiproject.Service.PostService;
import ideaprojects.restapiproject.entity.DTO.PostDTO;
import ideaprojects.restapiproject.entity.DTO.request.CreatePostRequest;
import ideaprojects.restapiproject.entity.DTO.request.UpdatePostRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class PostController {
    private final PostService postService;

    @Autowired
    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping("/posts")
    public List<PostDTO> getPosts(){
        return postService.findAll().getPosts();
    }

    @GetMapping("/posts/{id}")
    public PostDTO findById(@PathVariable int id) {
        return postService.findById(id);
    }

    @PostMapping("/posts")
    public PostDTO save(@RequestBody CreatePostRequest createPostRequest){
        return postService.save(createPostRequest);
    }


    @PutMapping("/posts/{id}")
    public PostDTO update(@RequestBody UpdatePostRequest updatePostRequest, @PathVariable int id){
        return postService.update(updatePostRequest, id);
    }

    @DeleteMapping("/posts/{id}")
    public void delete(@PathVariable int id){
        postService.delete(id);
    }
}

