package ideaprojects.restapiproject.controller.common;

import ideaprojects.restapiproject.Service.UserService;
import ideaprojects.restapiproject.entity.User;
import ideaprojects.restapiproject.entity.UserRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Set;

@Controller
@RequestMapping("/api")
public class AuthorizationController{

    private final UserService userService;
    private final BCryptPasswordEncoder encoder;

    public AuthorizationController(UserService userService,
                                   BCryptPasswordEncoder encoder) {
        this.userService = userService;
        this.encoder = encoder;
    }

    @GetMapping("/login")
    public String getLoginPage(Model model,
                               @RequestParam(required = false) String error) {
        model.addAttribute("isAuthenticatedFailed", error != null);
        model.addAttribute("registerMode", false);
        return "login-page";
    }

    @GetMapping("/registration")
    public String getRegistrationPage(Model model) {
        model.addAttribute("isAuthenticatedFailed", false);
        model.addAttribute("registerMode", true);
        return "login-page";
    }

    @PostMapping("/registration")
    public String createUser(@RequestParam String name,
                             @RequestParam String email,
                             @RequestParam String password) {

        String encodedPassword = encoder.encode(password);
        User user = new User(name, email, encodedPassword, null, LocalDateTime.now(), UserRole.USER);

        String result = userService.saveUser(user);
        if (!result.equals("User registered successfully")) {
            return "redirect:/api/registration?error=true";
        }

        return "redirect:/api/login";
    }

    private void forceAutoLogin(String email, String password){
        Set<SimpleGrantedAuthority> roles = Collections.singleton(UserRole.USER.toAuthority());
        Authentication authentication = new UsernamePasswordAuthenticationToken(email, password, roles);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

}
