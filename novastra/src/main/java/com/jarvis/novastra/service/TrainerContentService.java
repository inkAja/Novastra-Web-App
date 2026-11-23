package com.jarvis.novastra.service;

import com.jarvis.novastra.entity.CareerRole;
import com.jarvis.novastra.entity.Course;
import com.jarvis.novastra.entity.CourseModule;
import com.jarvis.novastra.entity.Enrollment;
import com.jarvis.novastra.entity.MicroTask;
import com.jarvis.novastra.entity.PortfolioProject;
import com.jarvis.novastra.entity.PortfolioSubmission;
import com.jarvis.novastra.repository.CareerRoleRepository;
import com.jarvis.novastra.repository.CertificateRepository;
import com.jarvis.novastra.repository.CourseModuleRepository;
import com.jarvis.novastra.repository.CourseRepository;
import com.jarvis.novastra.repository.EnrollmentRepository;
import com.jarvis.novastra.repository.MicroTaskRepository;
import com.jarvis.novastra.repository.PortfolioProjectRepository;
import com.jarvis.novastra.repository.PortfolioSubmissionRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrainerContentService {

    public record CourseRequest(String title, String typeCourse, String instructorName, Integer duration) {}

    public record ModuleRequest(String title, String videoUrl, Integer durationSeconds, Integer sequenceOrder) {}

    public record ProjectRequest(String courseId, String title, String expectedOutput) {}

    public record CourseItem(
            String courseId,
            String title,
            String typeCourse,
            String instructorName,
            Integer duration,
            long moduleCount,
            long projectCount,
            long enrollmentCount) {}

    public record ModuleItem(
            String moduleId,
            String courseId,
            String title,
            String videoUrl,
            Integer durationSeconds,
            Integer sequenceOrder,
            long microTaskCount) {}

    public record ProjectItem(
            String projectId,
            String courseId,
            String courseTitle,
            String title,
            String expectedOutput,
            long submissionCount) {}

    private final CourseRepository courseRepository;
    private final CourseModuleRepository courseModuleRepository;
    private final PortfolioProjectRepository portfolioProjectRepository;
    private final PortfolioSubmissionRepository portfolioSubmissionRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CertificateRepository certificateRepository;
    private final MicroTaskRepository microTaskRepository;
    private final CareerRoleRepository careerRoleRepository;

    public TrainerContentService(
            CourseRepository courseRepository,
            CourseModuleRepository courseModuleRepository,
            PortfolioProjectRepository portfolioProjectRepository,
            PortfolioSubmissionRepository portfolioSubmissionRepository,
            EnrollmentRepository enrollmentRepository,
            CertificateRepository certificateRepository,
            MicroTaskRepository microTaskRepository,
            CareerRoleRepository careerRoleRepository) {
        this.courseRepository = courseRepository;
        this.courseModuleRepository = courseModuleRepository;
        this.portfolioProjectRepository = portfolioProjectRepository;
        this.portfolioSubmissionRepository = portfolioSubmissionRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.certificateRepository = certificateRepository;
        this.microTaskRepository = microTaskRepository;
        this.careerRoleRepository = careerRoleRepository;
    }

    public Map<String, Object> listCourses() {
        List<Course> allCourses = courseRepository.findAll();
        Map<String, Long> moduleCounts = new HashMap<>();
        for (CourseModule m : courseModuleRepository.findAll()) {
            if (m.getCourseId() != null) moduleCounts.merge(m.getCourseId().trim(), 1L, Long::sum);
        }
        Map<String, Long> projectCounts = new HashMap<>();
        for (PortfolioProject p : portfolioProjectRepository.findAll()) {
            if (p.getCourseId() != null) projectCounts.merge(p.getCourseId().trim(), 1L, Long::sum);
        }
        Map<String, Long> enrollmentCounts = new HashMap<>();
        for (Enrollment e : enrollmentRepository.findAll()) {
            if (e.getCourseId() != null) enrollmentCounts.merge(e.getCourseId().trim(), 1L, Long::sum);
        }

        List<CourseItem> items = allCourses.stream()
                .sorted(Comparator.comparing(Course::getCourseId))
                .map(c -> toCourseItem(
                        c,
                        moduleCounts.getOrDefault(c.getCourseId().trim(), 0L),
                        projectCounts.getOrDefault(c.getCourseId().trim(), 0L),
                        enrollmentCounts.getOrDefault(c.getCourseId().trim(), 0L)))
                .toList();

        List<String> roleNames = careerRoleRepository.findAll().stream()
                .map(CareerRole::getRoleName)
                .filter(Objects::nonNull)
                .sorted()
                .toList();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("courses", items);
        body.put("roleNames", roleNames);
        return body;
    }

    @Transactional
    public Map<String, Object> createCourse(CourseRequest req) {
        ValidatedCourse v = validateCourse(req);
        List<String> existingIds = courseRepository.findAll().stream().map(Course::getCourseId).toList();
        String newId = nextSequenceId("CS", "CRS", existingIds);

        Course course = new Course();
        course.setCourseId(newId);
        course.setTitle(v.title());
        course.setTypeCourse(v.typeCourse());
        course.setInstructorName(v.instructorName());
        course.setDuration(v.duration());
        Course saved = courseRepository.saveAndFlush(course);

        return Map.of(
                "message", "Course baru berhasil dibuat (" + saved.getCourseId() + ").",
                "course", toCourseItem(saved, 0L, 0L, 0L));
    }

    @Transactional
    public Map<String, Object> updateCourse(String courseId, CourseRequest req) {
        String cid = requireId(courseId, "courseId");
        Course course = courseRepository.findById(cid)
                .orElseThrow(() -> new NoSuchElementException("Course tidak ditemukan."));
        ValidatedCourse v = validateCourse(req);

        course.setTitle(v.title());
        course.setTypeCourse(v.typeCourse());
        course.setInstructorName(v.instructorName());
        course.setDuration(v.duration());
        Course saved = courseRepository.saveAndFlush(course);

        long modCount = courseModuleRepository.countByCourseId(cid);
        long projCount = portfolioProjectRepository.findByCourseIdOrderByProjectIdAsc(cid).size();
        long enrollCount = enrollmentRepository.findAll().stream()
                .filter(e -> cid.equals(e.getCourseId() != null ? e.getCourseId().trim() : ""))
                .count();

        return Map.of(
                "message", "Data course berhasil diperbarui.",
                "course", toCourseItem(saved, modCount, projCount, enrollCount));
    }

    @Transactional
    public Map<String, Object> deleteCourse(String courseId) {
        String cid = requireId(courseId, "courseId");
        Course course = courseRepository.findById(cid)
                .orElseThrow(() -> new NoSuchElementException("Course tidak ditemukan."));

        List<String> blockers = new ArrayList<>();
        long modCount = courseModuleRepository.countByCourseId(cid);
        if (modCount > 0) blockers.add(modCount + " materi modul (MODULES)");
        if (portfolioProjectRepository.existsByCourseId(cid)) blockers.add("proyek tugas (PORTOFOLIO_PROJECT)");
        if (enrollmentRepository.existsByCourseId(cid)) blockers.add("peserta terdaftar (ENROLLMENT)");
        if (certificateRepository.existsByCourseId(cid)) blockers.add("sertifikat terbit (CERTIFICATE)");

        if (!blockers.isEmpty()) {
            throw new IllegalStateException(
                    "Course \"" + course.getTitle() + "\" tidak dapat dihapus karena masih memiliki "
                            + String.join(", ", blockers) + ".");
        }

        courseRepository.delete(course);
        courseRepository.flush();
        return Map.of("message", "Course \"" + course.getTitle() + "\" berhasil dihapus.");
    }

    public Map<String, Object> listModulesByCourse(String courseId) {
        String cid = requireId(courseId, "courseId");
        Course course = courseRepository.findById(cid)
                .orElseThrow(() -> new NoSuchElementException("Course tidak ditemukan."));

        List<CourseModule> modules = courseModuleRepository.findByCourseIdOrderBySequenceOrderAsc(cid);
        Map<String, Long> taskCounts = countMicroTasksByModule(modules);

        List<ModuleItem> items = modules.stream()
                .sorted(Comparator
                        .comparing(CourseModule::getSequenceOrder, Comparator.nullsLast(Integer::compareTo))
                        .thenComparing(CourseModule::getModuleId))
                .map(m -> toModuleItem(m, taskCounts.getOrDefault(m.getModuleId().trim(), 0L)))
                .toList();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("course", toCourseItem(course, items.size(), 0L, 0L));
        body.put("modules", items);
        return body;
    }

    @Transactional
    public Map<String, Object> createModule(String courseId, ModuleRequest req) {
        String cid = requireId(courseId, "courseId");
        if (!courseRepository.existsById(cid)) {
            throw new NoSuchElementException("Course induk tidak ditemukan.");
        }
        ValidatedModule v = validateModule(req);

        List<String> existingIds = courseModuleRepository.findAll().stream().map(CourseModule::getModuleId).toList();
        String newId = nextSequenceId("MD", "MOD", existingIds);

        CourseModule mod = new CourseModule();
        mod.setModuleId(newId);
        mod.setCourseId(cid);
        mod.setTitle(v.title());
        mod.setVideoUrl(v.videoUrl());
        mod.setDurationSeconds(v.durationSeconds());
        mod.setSequenceOrder(v.sequenceOrder());
        CourseModule saved = courseModuleRepository.saveAndFlush(mod);

        return Map.of(
                "message", "Materi baru berhasil ditambahkan (" + saved.getModuleId() + ").",
                "module", toModuleItem(saved, 0L));
    }

    @Transactional
    public Map<String, Object> updateModule(String moduleId, ModuleRequest req) {
        String mid = requireId(moduleId, "moduleId");
        CourseModule mod = courseModuleRepository.findById(mid)
                .orElseThrow(() -> new NoSuchElementException("Materi modul tidak ditemukan."));
        ValidatedModule v = validateModule(req);

        mod.setTitle(v.title());
        mod.setVideoUrl(v.videoUrl());
        mod.setDurationSeconds(v.durationSeconds());
        mod.setSequenceOrder(v.sequenceOrder());
        CourseModule saved = courseModuleRepository.saveAndFlush(mod);

        long taskCount = microTaskRepository.findByModuleIdIn(List.of(mid)).size();
        return Map.of(
                "message", "Materi modul berhasil diperbarui.",
                "module", toModuleItem(saved, taskCount));
    }

    @Transactional
    public Map<String, Object> deleteModule(String moduleId) {
        String mid = requireId(moduleId, "moduleId");
        CourseModule mod = courseModuleRepository.findById(mid)
                .orElseThrow(() -> new NoSuchElementException("Materi modul tidak ditemukan."));

        if (microTaskRepository.existsByModuleId(mid)) {
            throw new IllegalStateException(
                    "Materi \"" + mod.getTitle() + "\" tidak dapat dihapus karena masih memiliki Micro-Task / kuis terhubung.");
        }

        courseModuleRepository.delete(mod);
        courseModuleRepository.flush();
        return Map.of("message", "Materi \"" + mod.getTitle() + "\" berhasil dihapus.");
    }

    public Map<String, Object> listProjects(String courseIdFilter) {
        String filterCid = courseIdFilter != null ? courseIdFilter.trim() : "";
        List<Course> allCourses = courseRepository.findAll().stream()
                .sorted(Comparator.comparing(Course::getCourseId))
                .toList();
        Map<String, Course> courseById = allCourses.stream()
                .collect(Collectors.toMap(c -> c.getCourseId().trim(), c -> c, (a, b) -> a));

        List<PortfolioProject> rawProjects = filterCid.isEmpty()
                ? portfolioProjectRepository.findAll()
                : portfolioProjectRepository.findByCourseIdOrderByProjectIdAsc(filterCid);

        Map<String, Long> subCounts = new HashMap<>();
        for (PortfolioSubmission s : portfolioSubmissionRepository.findAll()) {
            if (s.getProjectId() != null) subCounts.merge(s.getProjectId().trim(), 1L, Long::sum);
        }

        List<ProjectItem> projectItems = rawProjects.stream()
                .sorted(Comparator.comparing(PortfolioProject::getProjectId))
                .map(p -> {
                    Course c = p.getCourseId() != null ? courseById.get(p.getCourseId().trim()) : null;
                    return toProjectItem(p, c, subCounts.getOrDefault(p.getProjectId().trim(), 0L));
                })
                .toList();

        List<Map<String, String>> courseOptions = allCourses.stream()
                .map(c -> Map.of("courseId", c.getCourseId(), "title", c.getTitle(), "typeCourse", c.getTypeCourse()))
                .toList();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("projects", projectItems);
        body.put("courses", courseOptions);
        return body;
    }

    @Transactional
    public Map<String, Object> createProject(ProjectRequest req) {
        ValidatedProject v = validateProject(req);
        Course course = courseRepository.findById(v.courseId())
                .orElseThrow(() -> new IllegalArgumentException("Course induk yang dipilih tidak ditemukan."));

        List<String> existingIds = portfolioProjectRepository.findAll().stream().map(PortfolioProject::getProjectId).toList();
        String newId = nextSequenceId("PJ", "PRJ", existingIds);

        PortfolioProject project = new PortfolioProject();
        project.setProjectId(newId);
        project.setCourseId(course.getCourseId());
        project.setTitle(v.title());
        project.setExpectedOutput(v.expectedOutput());
        PortfolioProject saved = portfolioProjectRepository.saveAndFlush(project);

        return Map.of(
                "message", "Target proyek baru berhasil dibuat (" + saved.getProjectId() + ").",
                "project", toProjectItem(saved, course, 0L));
    }

    @Transactional
    public Map<String, Object> updateProject(String projectId, ProjectRequest req) {
        String pid = requireId(projectId, "projectId");
        PortfolioProject project = portfolioProjectRepository.findById(pid)
                .orElseThrow(() -> new NoSuchElementException("Target proyek tidak ditemukan."));
        ValidatedProject v = validateProject(req);
        Course course = courseRepository.findById(v.courseId())
                .orElseThrow(() -> new IllegalArgumentException("Course induk yang dipilih tidak ditemukan."));

        project.setCourseId(course.getCourseId());
        project.setTitle(v.title());
        project.setExpectedOutput(v.expectedOutput());
        PortfolioProject saved = portfolioProjectRepository.saveAndFlush(project);

        long subCount = portfolioSubmissionRepository.findAll().stream()
                .filter(s -> pid.equals(s.getProjectId() != null ? s.getProjectId().trim() : ""))
                .count();

        return Map.of(
                "message", "Target proyek berhasil diperbarui.",
                "project", toProjectItem(saved, course, subCount));
    }

    @Transactional
    public Map<String, Object> deleteProject(String projectId) {
        String pid = requireId(projectId, "projectId");
        PortfolioProject project = portfolioProjectRepository.findById(pid)
                .orElseThrow(() -> new NoSuchElementException("Target proyek tidak ditemukan."));

        if (portfolioSubmissionRepository.existsByProjectId(pid)) {
            throw new IllegalStateException(
                    "Proyek \"" + project.getTitle() + "\" tidak dapat dihapus karena sudah dikerjakan peserta.");
        }

        portfolioProjectRepository.delete(project);
        portfolioProjectRepository.flush();
        return Map.of("message", "Target proyek \"" + project.getTitle() + "\" berhasil dihapus.");
    }

    static String nextSequenceId(String preferredPrefix, String altPrefix, List<String> existingIds) {
        Set<String> used = existingIds.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
        String prefix = used.stream().anyMatch(id -> id.startsWith(preferredPrefix))
                ? preferredPrefix
                : (altPrefix != null && used.stream().anyMatch(id -> id.startsWith(altPrefix)) ? altPrefix : preferredPrefix);

        int max = 0;
        for (String id : used) {
            if (id.startsWith(prefix)) {
                String tail = id.substring(prefix.length());
                if (!tail.isEmpty() && tail.chars().allMatch(Character::isDigit)) {
                    max = Math.max(max, Integer.parseInt(tail));
                }
            }
        }
        int digits = Math.max(1, 5 - prefix.length());
        String fmt = "%s%0" + digits + "d";
        int nextNum = max + 1;
        String candidate = String.format(Locale.ROOT, fmt, prefix, nextNum);
        while (used.contains(candidate)) {
            nextNum++;
            candidate = String.format(Locale.ROOT, fmt, prefix, nextNum);
        }
        if (candidate.length() > 5) {
            throw new IllegalStateException("Batas kapasitas ID 5 karakter untuk prefix " + prefix + " sudah penuh.");
        }
        return candidate;
    }

    private Map<String, Long> countMicroTasksByModule(List<CourseModule> modules) {
        if (modules.isEmpty()) return Map.of();
        List<String> moduleIds = modules.stream().map(CourseModule::getModuleId).toList();
        Map<String, Long> counts = new HashMap<>();
        for (MicroTask t : microTaskRepository.findByModuleIdIn(moduleIds)) {
            if (t.getModuleId() != null) counts.merge(t.getModuleId().trim(), 1L, Long::sum);
        }
        return counts;
    }

    private record ValidatedCourse(String title, String typeCourse, String instructorName, int duration) {}

    private record ValidatedModule(String title, String videoUrl, int durationSeconds, int sequenceOrder) {}

    private record ValidatedProject(String courseId, String title, String expectedOutput) {}

    private static ValidatedCourse validateCourse(CourseRequest req) {
        if (req == null) throw new IllegalArgumentException("Payload data course wajib diisi.");
        String title = requireText(req.title(), "Judul course", 255);
        String typeCourse = requireText(req.typeCourse(), "Kategori / Role (typeCourse)", 60);
        String instructor = requireText(req.instructorName(), "Nama instruktur", 255);
        if (req.duration() == null || req.duration() <= 0) {
            throw new IllegalArgumentException("Durasi course (menit) harus lebih dari 0.");
        }
        return new ValidatedCourse(title, typeCourse, instructor, req.duration());
    }

    private static ValidatedModule validateModule(ModuleRequest req) {
        if (req == null) throw new IllegalArgumentException("Payload data materi modul wajib diisi.");
        String title = requireText(req.title(), "Judul materi modul", 255);
        String videoUrl = requireText(req.videoUrl(), "URL video materi", 255);
        String lower = videoUrl.toLowerCase(Locale.ROOT);
        if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
            throw new IllegalArgumentException("URL video materi harus diawali http:// atau https://.");
        }
        if (req.durationSeconds() == null || req.durationSeconds() <= 0) {
            throw new IllegalArgumentException("Durasi video (detik) harus lebih dari 0.");
        }
        if (req.sequenceOrder() == null || req.sequenceOrder() < 1) {
            throw new IllegalArgumentException("Nomor urut materi (sequenceOrder) minimal 1.");
        }
        return new ValidatedModule(title, videoUrl, req.durationSeconds(), req.sequenceOrder());
    }

    private static ValidatedProject validateProject(ProjectRequest req) {
        if (req == null) throw new IllegalArgumentException("Payload data target proyek wajib diisi.");
        String courseId = requireId(req.courseId(), "Course induk (courseId)");
        String title = requireText(req.title(), "Judul proyek", 60);
        String expected = requireText(req.expectedOutput(), "Expected Output proyek", 255);
        return new ValidatedProject(courseId, title, expected);
    }

    private static String requireId(String id, String fieldLabel) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException(fieldLabel + " wajib diisi.");
        }
        return id.trim();
    }

    private static String requireText(String raw, String fieldLabel, int maxLen) {
        String trimmed = raw != null ? raw.trim() : "";
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException(fieldLabel + " wajib diisi.");
        }
        if (trimmed.length() > maxLen) {
            throw new IllegalArgumentException(fieldLabel + " maksimal " + maxLen + " karakter.");
        }
        return trimmed;
    }

    private static CourseItem toCourseItem(Course c, long modules, long projects, long enrollments) {
        return new CourseItem(
                c.getCourseId(),
                c.getTitle(),
                c.getTypeCourse(),
                c.getInstructorName(),
                c.getDuration(),
                modules,
                projects,
                enrollments);
    }

    private static ModuleItem toModuleItem(CourseModule m, long microTaskCount) {
        return new ModuleItem(
                m.getModuleId(),
                m.getCourseId(),
                m.getTitle(),
                m.getVideoUrl(),
                m.getDurationSeconds(),
                m.getSequenceOrder(),
                microTaskCount);
    }

    private static ProjectItem toProjectItem(PortfolioProject p, Course c, long submissionCount) {
        return new ProjectItem(
                p.getProjectId(),
                p.getCourseId(),
                c != null ? c.getTitle() : p.getCourseId(),
                p.getTitle(),
                p.getExpectedOutput(),
                submissionCount);
    }
}
