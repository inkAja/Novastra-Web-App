package com.jarvis.novastra.model;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.CopyOnWriteArrayList;

public class PracticeRoom {

    public static final int MAX_PARTICIPANTS = 2;
    private static final int MAX_NOTES = 100;

    private final String roomId;
    private final String scenarioType;
    private final CopyOnWriteArrayList<RoomParticipant> participants = new CopyOnWriteArrayList<>();
    private final CopyOnWriteArrayList<RoomNote> notes = new CopyOnWriteArrayList<>();

    public PracticeRoom(String roomId, String scenarioType) {
        this.roomId = roomId;
        this.scenarioType = scenarioType;
    }

    public String getRoomId() {
        return roomId;
    }

    public String getScenarioType() {
        return scenarioType;
    }

    public List<RoomParticipant> getParticipants() {
        return List.copyOf(participants);
    }

    public List<RoomNote> getNotes() {
        return List.copyOf(notes);
    }

    /** Joins a participant or returns the existing entry on reconnect; enforces max 2 peers. */
    public synchronized RoomParticipant addOrKeepParticipant(RoomParticipant candidate) {
        Optional<RoomParticipant> existing = findParticipant(candidate.getUserId());
        if (existing.isPresent()) {
            return existing.get();
        }
        if (participants.size() >= MAX_PARTICIPANTS) {
            throw new IllegalStateException("Ruang latihan topik ini sudah penuh (maksimal 2 peserta).");
        }
        participants.add(candidate);
        return candidate;
    }

    /** Removes the participant and returns true when the room becomes empty. */
    public synchronized boolean removeParticipant(String userId) {
        participants.removeIf(p -> p.getUserId().equals(userId));
        return participants.isEmpty();
    }

    public Optional<RoomParticipant> findParticipant(String userId) {
        return participants.stream()
                .filter(p -> p.getUserId().equals(userId))
                .findFirst();
    }

    public synchronized void addNote(RoomNote note) {
        notes.add(note);
        if (notes.size() > MAX_NOTES) {
            notes.remove(0);
        }
    }
}
