package ideaprojects.restapiproject.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("api")
public class ViewController {

    @GetMapping("/")
    public String index() {
        return "home-page";
    }

    @GetMapping("/home")
    public String posts() {
        return "index";
    }
}

