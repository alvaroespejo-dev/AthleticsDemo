package com.aespejo.registrations.api.security;


import com.aespejo.registrations.infrastructure.security.Policies;
import org.springframework.security.access.prepost.PreAuthorize;
import com.aespejo.registrations.application.security.AuthService;
import com.aespejo.registrations.domain.entities.User;
import com.aespejo.registrations.domain.enums.UserRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    /** Request body of the login endpoint. */
    public record LoginRequest(
            @NotBlank @Size(min = 3, max = 60) String loginName,
            @NotBlank @Size(max = 200) String password) {
    }

    /** Successful login: the access token and the signed-in user. */
    public record LoginResponse(
            String token,
            Instant expiresAt,
            Integer userId,
            String loginName,
            String name,
            UserRole role,
            String preferredLanguage) {
    }

    public record CurrentUserResponse(
            Integer userId,
            String loginName,
            String name,
            UserRole role,
            String preferredLanguage) {
    }

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 10, max = 200) String newPassword) {
    }

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        AuthService.Session session = auth.login(request.loginName(), request.password());
        User user = session.user();
        return new LoginResponse(
                session.token().value(),
                session.token().expiresAt(),
                user.getId(),
                user.getLoginName(),
                user.getName(),
                user.getRole(),
                user.getPreferredLanguage());
    }

    @GetMapping("/me")
    public CurrentUserResponse me(@AuthenticationPrincipal Jwt jwt) {
        User user = auth.currentUser(Integer.parseInt(jwt.getSubject()));
        return new CurrentUserResponse(
                user.getId(),
                user.getLoginName(),
                user.getName(),
                user.getRole(),
                user.getPreferredLanguage());
    }

    @PreAuthorize(Policies.READ)
    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ChangePasswordRequest request) {
        auth.changePassword(Integer.parseInt(jwt.getSubject()), request.currentPassword(), request.newPassword());
    }
}
