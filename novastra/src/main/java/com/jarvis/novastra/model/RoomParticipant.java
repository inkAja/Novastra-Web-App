package com.jarvis.novastra.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RoomParticipant {

    private final String userId;
    private final String fullName;
    private final String roleName;
    private volatile boolean isMuted;
    private volatile boolean isHandRaised;

    public RoomParticipant(String userId, String fullName, String roleName) {
        this.userId = userId;
        this.fullName = fullName;
        this.roleName = roleName;
        this.isMuted = false;
        this.isHandRaised = false;
    }

    public String getUserId() {
        return userId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getRoleName() {
        return roleName;
    }

    @JsonProperty("isMuted")
    public boolean isMuted() {
        return isMuted;
    }

    @JsonProperty("isHandRaised")
    public boolean isHandRaised() {
        return isHandRaised;
    }

    public void toggleMute() {
        this.isMuted = !this.isMuted;
    }

    public void toggleHandRaised() {
        this.isHandRaised = !this.isHandRaised;
    }
}
