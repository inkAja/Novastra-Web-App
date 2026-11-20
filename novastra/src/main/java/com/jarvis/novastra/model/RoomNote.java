package com.jarvis.novastra.model;

public class RoomNote {

    private final String senderName;
    private final String content;
    private final String timestamp;

    public RoomNote(String senderName, String content, String timestamp) {
        this.senderName = senderName;
        this.content = content;
        this.timestamp = timestamp;
    }

    public String getSenderName() {
        return senderName;
    }

    public String getContent() {
        return content;
    }

    public String getTimestamp() {
        return timestamp;
    }
}
