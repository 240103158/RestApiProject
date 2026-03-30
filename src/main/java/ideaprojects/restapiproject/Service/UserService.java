package ideaprojects.restapiproject.Service;


import ideaprojects.restapiproject.entity.User;
import ideaprojects.restapiproject.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@Transactional
public class UserService {
    private final UserRepository userRepository;

    @Autowired
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void saveUser(User user){
        userRepository.save(user);
    }

    public User getCurrentUser(){
        String email = SecurityContextHolder.getContext().getAuthentication().getName(); // todo give me current user information with Spring Boot helping

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User this email: " + email + "not found" ));
    }
}
