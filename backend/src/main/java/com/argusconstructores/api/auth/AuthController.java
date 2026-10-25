package com.argusconstructores.api.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final TokenService tokenService;
    private final LoginThrottle loginThrottle;

    public AuthController(AuthenticationManager authenticationManager, TokenService tokenService,
                          LoginThrottle loginThrottle) {
        this.authenticationManager = authenticationManager;
        this.tokenService = tokenService;
        this.loginThrottle = loginThrottle;
    }

    /**
     * Wrong credentials raise BadCredentialsException, answered as a 401 by GlobalExceptionHandler;
     * a locked username gets a 429 before its password is even checked.
     */
    @PostMapping("/login")
    public TokenService.IssuedToken login(@Valid @RequestBody LoginRequest request) {
        loginThrottle.checkAllowed(request.username());
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(request.username(), request.password()));
        } catch (AuthenticationException ex) {
            loginThrottle.recordFailure(request.username());
            throw ex;
        }
        loginThrottle.recordSuccess(request.username());
        return tokenService.issue(authentication);
    }

    @GetMapping("/me")
    public CurrentUser me(@AuthenticationPrincipal Jwt jwt) {
        return new CurrentUser(jwt.getSubject(), jwt.getClaimAsStringList(TokenService.ROLES_CLAIM));
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {
    }

    public record CurrentUser(String username, List<String> roles) {
    }
}
