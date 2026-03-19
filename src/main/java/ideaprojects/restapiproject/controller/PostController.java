package ideaprojects.restapiproject.controller;

import ideaprojects.restapiproject.entity.DTO.PostContainerDTO;
import ideaprojects.restapiproject.Service.PostService;
import ideaprojects.restapiproject.entity.DTO.PostDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class PostController {
    private final PostService postService;

    @Autowired
    public PostController(PostService postService) {
        this.postService = postService;
    }

    @ResponseBody
    @GetMapping("/posts")
    public PostContainerDTO getPosts(){
        return postService.findAll();
    }

    @ResponseBody
    @GetMapping("/posts/{id}")
    public PostDTO findById(@PathVariable int id) {
        return postService.findById(id);
    }
}
