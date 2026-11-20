package com.jarvis.novastra.service;

import com.jarvis.novastra.entity.CareerRole;
import com.jarvis.novastra.entity.User;
import com.jarvis.novastra.model.PracticeRoom;
import com.jarvis.novastra.model.RoomNote;
import com.jarvis.novastra.model.RoomParticipant;
import com.jarvis.novastra.repository.CareerRoleRepository;
import com.jarvis.novastra.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudyPodRoomService {

    private static final String DEFAULT_ROLE_NAME = "Peserta Jalur Karier";
    private static final BigDecimal DEFAULT_LEAVE_SENTIMENT = new BigDecimal("90.00");
    private static final DateTimeFormatter NOTE_TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");

    // shortcut: in-memory ConcurrentHashMap keyed by normalized topic; upgrade to Redis/WebSocket for multi-instance deployment
    private final ConcurrentHashMap<String, PracticeRoom> activeRooms = new ConcurrentHashMap<>();

    private final UserRepository userRepository;
    private final CareerRoleRepository careerRoleRepository;
    private final StudyPodService studyPodService;

    public StudyPodRoomService(
            UserRepository userRepository,
            CareerRoleRepository careerRoleRepository,
            StudyPodService studyPodService) {
        this.userRepository = userRepository;
        this.careerRoleRepository = careerRoleRepository;
        this.studyPodService = studyPodService;
    }

    public Map<String, Object> joinRoom(String userId, String scenarioType) {
        User user = requireUser(userId);
        String scenario = normalizeTopic(scenarioType);
        String displayName = (user.getFullName() != null && !user.getFullName().isBlank())
                ? user.getFullName().trim()
                : "Learner";
        String roleName = resolveRoleName(user.getRoleId());

        PracticeRoom room = activeRooms.compute(roomKey(scenario), (k, existing) -> {
            PracticeRoom target = existing != null
                    ? existing
                    : new PracticeRoom("RM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT), scenario);
            target.addOrKeepParticipant(new RoomParticipant(user.getUserId(), displayName, roleName));
            return target;
        });

        return toStateMap(room);
    }

    public Map<String, Object> getRoomState(String scenarioType) {
        String scenario = normalizeTopic(scenarioType);
        PracticeRoom room = activeRooms.get(roomKey(scenario));
        if (room == null) {
            Map<String, Object> empty = new LinkedHashMap<>();
            empty.put("roomId", null);
            empty.put("scenarioType", scenario);
            empty.put("participantCount", 0);
            empty.put("participants", List.of());
            empty.put("notes", List.of());
            return empty;
        }
        return toStateMap(room);
    }

    public Map<String, Object> performAction(
            String userId, String scenarioType, String actionType, String payload) {
        String uid = requireNonBlank(userId, "userId wajib diisi.");
        String scenario = normalizeTopic(scenarioType);
        String action = requireNonBlank(actionType, "actionType wajib diisi.").toUpperCase(Locale.ROOT);

        PracticeRoom room = activeRooms.get(roomKey(scenario));
        if (room == null) {
            throw new NoSuchElementException("Ruang latihan belum aktif.");
        }

        RoomParticipant participant = room.findParticipant(uid)
                .orElseThrow(() -> new NoSuchElementException("Peserta tidak terdaftar di ruang latihan ini."));

        switch (action) {
            case "TOGGLE_MUTE" -> participant.toggleMute();
            case "TOGGLE_HAND" -> participant.toggleHandRaised();
            case "ADD_NOTE" -> {
                String noteText = requireNonBlank(payload, "Isi catatan tidak boleh kosong.");
                if (noteText.length() > 240) {
                    throw new IllegalArgumentException("Catatan maksimal 240 karakter.");
                }
                room.addNote(new RoomNote(
                        participant.getFullName(),
                        noteText,
                        LocalTime.now().format(NOTE_TIME_FORMAT)));
            }
            default -> throw new IllegalArgumentException("Aksi ruang latihan tidak dikenali: " + action);
        }

        return toStateMap(room);
    }

    @Transactional
    public Map<String, Object> leaveRoom(String userId, String scenarioType) {
        User user = requireUser(userId);
        String scenario = normalizeTopic(scenarioType);
        String key = roomKey(scenario);

        activeRooms.computeIfPresent(key, (k, room) -> room.removeParticipant(user.getUserId()) ? null : room);

        Map<String, Object> response = new LinkedHashMap<>(
                studyPodService.createPeerSession(
                        user.getUserId(),
                        StudyPodService.PEER_MATCH,
                        scenario,
                        DEFAULT_LEAVE_SENTIMENT));
        response.put("roomActive", activeRooms.containsKey(key));
        return response;
    }

    private User requireUser(String userId) {
        String uid = requireNonBlank(userId, "userId wajib diisi.");
        return userRepository.findById(uid)
                .orElseThrow(() -> new NoSuchElementException("User tidak ditemukan."));
    }

    private String resolveRoleName(String roleId) {
        if (roleId == null || roleId.isBlank()) {
            return DEFAULT_ROLE_NAME;
        }
        return careerRoleRepository.findById(roleId.trim())
                .map(CareerRole::getRoleName)
                .filter(name -> !name.isBlank())
                .orElse(DEFAULT_ROLE_NAME);
    }

    private static String normalizeTopic(String scenarioType) {
        String topic = requireNonBlank(scenarioType, "Topik latihan (scenarioType) wajib diisi.");
        if (topic.length() > 255) {
            throw new IllegalArgumentException("Topik latihan maksimal 255 karakter.");
        }
        return topic;
    }

    private static String roomKey(String scenario) {
        return scenario.toLowerCase(Locale.ROOT);
    }

    private static String requireNonBlank(String value, String errorMessage) {
        String trimmed = value != null ? value.trim() : "";
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException(errorMessage);
        }
        return trimmed;
    }

    private static Map<String, Object> toStateMap(PracticeRoom room) {
        List<RoomParticipant> participants = room.getParticipants();
        Map<String, Object> state = new LinkedHashMap<>();
        state.put("roomId", room.getRoomId());
        state.put("scenarioType", room.getScenarioType());
        state.put("participantCount", participants.size());
        state.put("participants", participants);
        state.put("notes", room.getNotes());
        return state;
    }
}
