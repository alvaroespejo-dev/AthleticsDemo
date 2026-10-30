package com.aespejo.registrations.application.security;

import com.aespejo.registrations.common.exception.BusinessRuleException;
import com.aespejo.registrations.common.exception.NotFoundException;
import com.aespejo.registrations.common.exception.UnauthorizedException;
import com.aespejo.registrations.domain.entities.User;
import com.aespejo.registrations.infrastructure.persistence.repository.UserRepository;
import com.aespejo.registrations.infrastructure.security.TokenIssuer;
import java.time.OffsetDateTime;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Login, current-user lookup and password change for back-office users. */
@Service
public class AuthService {

    /**
     * Valid BCrypt hash of a password nobody knows. It is checked when the login name does not exist,
     * so both cases take the same time and the response does not reveal which names exist.
     */
    private static final String DECOY_HASH = "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    /** Minimum length for a new password. */
    private static final int MIN_NEW_PASSWORD_LENGTH = 10;

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final TokenIssuer tokenIssuer;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, TokenIssuer tokenIssuer) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.tokenIssuer = tokenIssuer;
    }

    /** Result of a successful login: the token and the user it belongs to. */
    public record Session(TokenIssuer.IssuedToken token, User user) {
    }

    @Transactional
    public Session login(String loginName, String password) {
        String trimmedLoginName = loginName.trim();
        User user = users.findByLoginName(trimmedLoginName).orElse(null);

        String hashToCheck = user == null ? DECOY_HASH : user.getPasswordHash();
        boolean matches = passwordEncoder.matches(password, hashToCheck);

        if (user == null || !matches || !user.isActive()) {
            throw new UnauthorizedException("auth.invalidCredentials");
        }

        user.setLastAccessAt(OffsetDateTime.now());
        return new Session(tokenIssuer.issue(user), user);
    }

    @Transactional(readOnly = true)
    public User currentUser(int userId) {
        return users.findById(userId).orElseThrow(() -> new NotFoundException("entity.user", userId));
    }

    @Transactional
    public void changePassword(int userId, String currentPassword, String newPassword) {
        User user = currentUser(userId);

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new UnauthorizedException("auth.password.wrongCurrent");
        }
        if (currentPassword.equals(newPassword)) {
            throw new BusinessRuleException("auth.password.sameAsCurrent");
        }
        if (newPassword.length() < MIN_NEW_PASSWORD_LENGTH) {
            throw new BusinessRuleException("auth.password.tooShort", MIN_NEW_PASSWORD_LENGTH);
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
    }
}
