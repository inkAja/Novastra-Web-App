package com.jarvis.novastra.service;

import com.jarvis.novastra.entity.MicroTask;
import com.jarvis.novastra.entity.MicroTaskResult;
import com.jarvis.novastra.repository.CourseModuleRepository;
import com.jarvis.novastra.repository.MicroTaskRepository;
import com.jarvis.novastra.repository.MicroTaskResultRepository;
import com.jarvis.novastra.repository.UserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MicroTaskService {

    private static final BigDecimal ZERO_SCORE = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    private static final BigDecimal FULL_SCORE = BigDecimal.valueOf(100).setScale(2, RoundingMode.HALF_UP);
    private static final BigDecimal PASSING_SCORE = BigDecimal.valueOf(75).setScale(2, RoundingMode.HALF_UP);
    private static final int MIN_BLIND_TEST_ANSWER_LEN = 12;

    public record BlindTestAnswer(String taskId, String answer) {}

    private final MicroTaskRepository microTaskRepository;
    private final MicroTaskResultRepository microTaskResultRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final UserRepository userRepository;

    public MicroTaskService(
            MicroTaskRepository microTaskRepository,
            MicroTaskResultRepository microTaskResultRepository,
            CourseModuleRepository courseModuleRepository,
            UserRepository userRepository) {
        this.microTaskRepository = microTaskRepository;
        this.microTaskResultRepository = microTaskResultRepository;
        this.courseModuleRepository = courseModuleRepository;
        this.userRepository = userRepository;
    }

    public List<Map<String, Object>> getMicroTasksByModule(String moduleId, String userId) {
        if (moduleId == null || moduleId.isBlank()) {
            throw new IllegalArgumentException("moduleId wajib diisi.");
        }
        String mid = moduleId.trim();
        if (!courseModuleRepository.existsById(mid)) {
            throw new NoSuchElementException("Modul tidak ditemukan.");
        }

        List<MicroTask> tasks = microTaskRepository.findByModuleIdOrderByTimestampSecondsAscTaskIdAsc(mid);
        Map<String, MicroTaskResult> resultsByTask = Map.of();
        if (userId != null && !userId.isBlank() && !tasks.isEmpty()) {
            List<String> taskIds = tasks.stream().map(MicroTask::getTaskId).toList();
            resultsByTask = microTaskResultRepository.findByUserIdAndTaskIdIn(userId.trim(), taskIds).stream()
                    .collect(Collectors.toMap(
                            r -> r.getTaskId().trim(),
                            r -> r,
                            (a, b) -> a.getScore().compareTo(b.getScore()) >= 0 ? a : b));
        }

        Map<String, MicroTaskResult> finalResults = resultsByTask;
        return tasks.stream().map(task -> {
            MicroTaskResult result = finalResults.get(task.getTaskId().trim());
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("taskId", task.getTaskId());
            item.put("moduleId", task.getModuleId());
            item.put("timestampSeconds", task.getTimestampSeconds());
            item.put("questionText", task.getQuestionText());
            item.put("taskType", task.getTaskType());
            item.put("isCompleted", result != null);
            item.put("score", result != null ? result.getScore() : null);
            item.put("completedAt", result != null ? result.getCompletedAt() : null);
            return item;
        }).toList();
    }

    @Transactional
    public Map<String, Object> submitMicroTask(String taskId, String userId, String answer) {
        return submitMicroTask(taskId, userId, answer, FULL_SCORE);
    }

    @Transactional
    public Map<String, Object> submitMicroTask(String taskId, String userId, String answer, BigDecimal submittedScore) {
        if (taskId == null || taskId.isBlank() || userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId dan taskId wajib diisi.");
        }
        if (answer == null || answer.isBlank()) {
            throw new IllegalArgumentException("Jawaban wajib diisi sebelum mengirim.");
        }
        String tid = taskId.trim();
        String uid = userId.trim();

        if (!userRepository.existsById(uid)) {
            throw new NoSuchElementException("User tidak ditemukan.");
        }
        MicroTask task = microTaskRepository.findById(tid)
                .orElseThrow(() -> new NoSuchElementException("Micro-task tidak ditemukan."));

        BigDecimal candidate = submittedScore != null
                ? submittedScore.max(ZERO_SCORE).min(FULL_SCORE).setScale(2, RoundingMode.HALF_UP)
                : FULL_SCORE;

        Optional<MicroTaskResult> existing = microTaskResultRepository.findFirstByUserIdAndTaskIdOrderByResultIdAsc(uid, tid);
        boolean alreadyCompleted = existing.isPresent();
        MicroTaskResult result = existing.orElseGet(() -> createResult(uid, tid));
        if (!alreadyCompleted || result.getScore() == null || candidate.compareTo(result.getScore()) >= 0) {
            result.setScore(candidate);
            result.setCompletedAt(LocalDate.now());
        }
        MicroTaskResult saved = microTaskResultRepository.save(result);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("resultId", saved.getResultId());
        response.put("userId", saved.getUserId());
        response.put("taskId", saved.getTaskId());
        response.put("moduleId", task.getModuleId());
        response.put("score", saved.getScore());
        response.put("completedAt", saved.getCompletedAt());
        response.put("isCompleted", true);
        response.put("alreadyCompleted", alreadyCompleted);
        return response;
    }

    @Transactional
    public Map<String, Object> submitBlindTest(String userId, List<BlindTestAnswer> answers) {
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId wajib diisi.");
        }
        if (answers == null || answers.isEmpty()) {
            throw new IllegalArgumentException("Daftar jawaban Blind Test wajib diisi.");
        }
        String uid = userId.trim();
        if (!userRepository.existsById(uid)) {
            throw new NoSuchElementException("User tidak ditemukan.");
        }

        Map<String, String> uniqueAnswers = new LinkedHashMap<>();
        boolean anyFilled = false;
        for (BlindTestAnswer item : answers) {
            if (item == null || item.taskId() == null || item.taskId().isBlank()) {
                continue;
            }
            String tid = item.taskId().trim();
            String text = item.answer() != null ? item.answer().trim() : "";
            if (!text.isEmpty()) {
                anyFilled = true;
            }
            uniqueAnswers.put(tid, text);
        }
        if (uniqueAnswers.isEmpty()) {
            throw new IllegalArgumentException("Daftar soal Blind Test tidak valid.");
        }
        if (!anyFilled) {
            throw new IllegalArgumentException("Isi minimal satu jawaban sebelum mengirim Blind Test.");
        }

        Set<String> savedTaskIds = new LinkedHashSet<>();
        for (Map.Entry<String, String> entry : uniqueAnswers.entrySet()) {
            String tid = entry.getKey();
            String text = entry.getValue();
            if (!microTaskRepository.existsById(tid)) {
                throw new NoSuchElementException("Micro-task tidak ditemukan.");
            }
            if (text.length() >= MIN_BLIND_TEST_ANSWER_LEN) {
                submitMicroTask(tid, uid, text, FULL_SCORE);
                savedTaskIds.add(tid);
            }
        }

        int totalTasksCount = uniqueAnswers.size();
        int completedTasksCount = savedTaskIds.size();
        int score = (int) Math.round((completedTasksCount * 100.0) / totalTasksCount);
        boolean passed = score >= PASSING_SCORE.intValue();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("userId", uid);
        result.put("score", score);
        result.put("passed", passed);
        result.put("passingScore", PASSING_SCORE.intValue());
        result.put("completedTasksCount", completedTasksCount);
        result.put("totalTasksCount", totalTasksCount);
        result.put("savedTaskIds", new ArrayList<>(savedTaskIds));
        return result;
    }

    private MicroTaskResult createResult(String userId, String taskId) {
        String latestId = microTaskResultRepository.findTopByResultIdStartingWithOrderByResultIdDesc("MR")
                .map(MicroTaskResult::getResultId)
                .orElse(null);
        MicroTaskResult result = new MicroTaskResult();
        result.setResultId(AuthService.nextId("MR", latestId));
        result.setUserId(userId);
        result.setTaskId(taskId);
        return result;
    }
}
