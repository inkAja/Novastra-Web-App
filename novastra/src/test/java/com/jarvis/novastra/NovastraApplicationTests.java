package com.jarvis.novastra;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.jarvis.novastra.config.NovastraDataSeeder;
import com.jarvis.novastra.entity.CareerRole;
import com.jarvis.novastra.entity.Certificate;
import com.jarvis.novastra.entity.Course;
import com.jarvis.novastra.entity.CourseModule;
import com.jarvis.novastra.entity.PortfolioProject;
import com.jarvis.novastra.entity.PortfolioSubmission;
import com.jarvis.novastra.entity.Skill;
import com.jarvis.novastra.entity.StudyPodSession;
import com.jarvis.novastra.entity.User;
import com.jarvis.novastra.repository.CareerRoleRepository;
import com.jarvis.novastra.repository.CareerSkillCalculationRepository;
import com.jarvis.novastra.repository.CertificateRepository;
import com.jarvis.novastra.repository.CourseModuleRepository;
import com.jarvis.novastra.repository.CourseRepository;
import com.jarvis.novastra.repository.EnrollmentRepository;
import com.jarvis.novastra.repository.MicroTaskRepository;
import com.jarvis.novastra.repository.MicroTaskResultRepository;
import com.jarvis.novastra.repository.PortfolioProjectRepository;
import com.jarvis.novastra.repository.PortfolioSubmissionRepository;
import com.jarvis.novastra.repository.SkillRepository;
import com.jarvis.novastra.repository.StudyPodSessionRepository;
import com.jarvis.novastra.repository.UserRepository;
import com.jarvis.novastra.repository.UserSkillGapRepository;
import com.jarvis.novastra.service.AuthService;
import com.jarvis.novastra.service.CareerService;
import com.jarvis.novastra.service.DashboardService;
import com.jarvis.novastra.service.EnrollmentService;
import com.jarvis.novastra.service.MicroTaskService;
import com.jarvis.novastra.service.OnboardingService;
import com.jarvis.novastra.service.ProfileService;
import com.jarvis.novastra.service.StudyPodRoomService;
import com.jarvis.novastra.service.StudyPodService;
import com.jarvis.novastra.service.TrainerReviewService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
class NovastraApplicationTests {

	@Autowired
	private CourseRepository courseRepository;

	@Autowired
	private CertificateRepository certificateRepository;

	@Autowired
	private EnrollmentRepository enrollmentRepository;

	@Autowired
	private CourseModuleRepository courseModuleRepository;

	@Autowired
	private MicroTaskRepository microTaskRepository;

	@Autowired
	private MicroTaskResultRepository microTaskResultRepository;

	@Autowired
	private PortfolioProjectRepository portfolioProjectRepository;

	@Autowired
	private PortfolioSubmissionRepository portfolioSubmissionRepository;

	@Autowired
	private CareerRoleRepository careerRoleRepository;

	@Autowired
	private CareerSkillCalculationRepository careerSkillCalculationRepository;

	@Autowired
	private SkillRepository skillRepository;

	@Autowired
	private StudyPodSessionRepository studyPodSessionRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private UserSkillGapRepository userSkillGapRepository;

	@Autowired
	private AuthService authService;

	@Autowired
	private OnboardingService onboardingService;

	@Autowired
	private DashboardService dashboardService;

	@Autowired
	private CareerService careerService;

	@Autowired
	private EnrollmentService enrollmentService;

	@Autowired
	private MicroTaskService microTaskService;

	@Autowired
	private ProfileService profileService;

	@Autowired
	private StudyPodService studyPodService;

	@Autowired
	private StudyPodRoomService studyPodRoomService;

	@Autowired
	private TrainerReviewService trainerReviewService;

	@Autowired
	private WebApplicationContext webApplicationContext;

	@Autowired
	private NovastraDataSeeder dataSeeder;

	@Test
	void contextLoadsAndQueriesPostgres() {
		assertTrue(courseRepository.count() > 0, "Expected courses in DB-Novastra");
		assertTrue(userRepository.count() > 0, "Expected users in DB-Novastra");
	}

	@Test
	@Transactional
	void seederPopulatesAllFiveRolesIdempotently() {
		List<String> expectedRoles = List.of(
				"Digital Marketing Lead",
				"Backend Engineer (Java)",
				"AI & Machine Learning Engineer",
				"Frontend & PWA Developer",
				"Data Analyst");

		long rolesBefore = careerRoleRepository.count();
		long skillsBefore = skillRepository.count();
		long coursesBefore = courseRepository.count();
		long modulesBefore = courseModuleRepository.count();
		long tasksBefore = microTaskRepository.count();
		long projectsBefore = portfolioProjectRepository.count();

		// Re-running seeder must be strictly idempotent
		dataSeeder.run();

		assertEquals(rolesBefore, careerRoleRepository.count());
		assertEquals(skillsBefore, skillRepository.count());
		assertEquals(coursesBefore, courseRepository.count());
		assertEquals(modulesBefore, courseModuleRepository.count());
		assertEquals(tasksBefore, microTaskRepository.count());
		assertEquals(projectsBefore, portfolioProjectRepository.count());

		for (String roleName : expectedRoles) {
			CareerRole role = careerRoleRepository.findByRoleName(roleName).orElseThrow();
			assertEquals(6, skillRepository.findByCategory(role.getRoleName()).size(), roleName);

			List<Course> courses = courseRepository.findByTypeCourse(role.getRoleName());
			assertEquals(3, courses.size(), roleName);
			List<String> courseIds = courses.stream().map(Course::getCourseId).toList();

			List<CourseModule> modules = courseModuleRepository.findByCourseIdInOrderByCourseIdAscSequenceOrderAsc(courseIds);
			assertEquals(9, modules.size(), roleName);

			List<String> moduleIds = modules.stream().map(CourseModule::getModuleId).toList();
			assertEquals(6, microTaskRepository.findByModuleIdInAndTaskType(moduleIds, "BLIND_TEST").size(), roleName);
			assertEquals(3, portfolioProjectRepository.findByCourseIdIn(courseIds).size(), roleName);
		}

		for (Course course : courseRepository.findAll()) {
			assertTrue(courseModuleRepository.countByCourseId(course.getCourseId()) >= 3,
					"Expected >= 3 modules for course " + course.getCourseId());
		}

		for (CourseModule mod : courseModuleRepository.findAll()) {
			assertTrue(microTaskRepository.existsByModuleIdAndTimestampSeconds(mod.getModuleId(), 300),
					"Expected 5-minute checkpoint micro-task for module " + mod.getModuleId());
		}

		for (CareerRole role : careerRoleRepository.findAll()) {
			assertTrue(courseRepository.findByTypeCourseIgnoreCase(role.getRoleName()).size() >= 3,
					"Expected >= 3 courses for role " + role.getRoleName());
			assertTrue(careerSkillCalculationRepository.findByRoleId(role.getRoleId()).size() >= 6,
					"Expected >= 6 skills for role " + role.getRoleName());
		}
	}

	@Test
	@Transactional
	void registerOnboardingDashboardAndCareerFlowAreRoleSpecific() {
		User backendUser = authService.register("Test Backend User", "backend.test@novastra.id", "secret123");
		assertEquals(0, backendUser.getTotalXp());
		assertEquals(0, backendUser.getStreakCount());
		assertNull(backendUser.getRoleId());
		assertFalse(backendUser.isOnboarded());

		Map<String, Object> preDashboard = dashboardService.getDashboard(backendUser.getUserId());
		assertEquals(false, preDashboard.get("isOnboarded"));
		assertEquals(0, preDashboard.get("totalXp"));
		assertEquals(0, preDashboard.get("streakCount"));
		assertEquals(0, preDashboard.get("averageProgress"));
		assertEquals(0, preDashboard.get("careerReadinessPercentage"));
		assertEquals(0, preDashboard.get("careerCompletedCoursesCount"));
		assertEquals(0, preDashboard.get("careerTotalCoursesCount"));
		assertTrue(((List<?>) preDashboard.get("enrollments")).isEmpty());

		CareerRole backendRole = careerRoleRepository.findByRoleName("Backend Engineer (Java)").orElseThrow();
		List<Skill> backendSkills = skillRepository.findByCategory(backendRole.getRoleName());
		onboardingService.saveOnboarding(
				backendUser.getUserId(),
				backendRole.getRoleId(),
				30,
				1,
				List.of(backendSkills.get(0).getSkillId()));

		assertEquals(1, userSkillGapRepository.findByUserId(backendUser.getUserId()).size());
		Map<String, Object> postDashboard = dashboardService.getDashboard(backendUser.getUserId());
		assertEquals(true, postDashboard.get("isOnboarded"));
		assertEquals("Backend Engineer (Java)", postDashboard.get("roleName"));
		assertEquals(0, postDashboard.get("averageProgress"));
		assertEquals(0, postDashboard.get("careerReadinessPercentage"));
		assertEquals(0, postDashboard.get("careerCompletedCoursesCount"));
		assertEquals(3, postDashboard.get("careerTotalCoursesCount"));

		Map<String, Object> backendCareer = careerService.getCareerData(backendUser.getUserId());
		assertEquals("Backend Engineer (Java)", backendCareer.get("roleName"));
		assertEquals(3, ((List<?>) backendCareer.get("curriculum")).size());
		assertEquals(6, ((List<?>) backendCareer.get("skillGaps")).size());
		assertEquals(3, ((List<?>) backendCareer.get("blindTests")).size());
		assertEquals(3, ((List<?>) backendCareer.get("roadmap")).size());
		assertEquals(3, ((List<?>) backendCareer.get("portfolioProjects")).size());

		User dmUser = authService.register("Test DM User", "dm.test@novastra.id", "secret123");
		CareerRole dmRole = careerRoleRepository.findByRoleName("Digital Marketing Lead").orElseThrow();
		List<Skill> dmSkills = skillRepository.findByCategory(dmRole.getRoleName());
		onboardingService.saveOnboarding(dmUser.getUserId(), dmRole.getRoleId(), 15, 0, List.of(dmSkills.get(0).getSkillId()));

		Map<String, Object> dmCareer = careerService.getCareerData(dmUser.getUserId());
		assertEquals("Digital Marketing Lead", dmCareer.get("roleName"));
		assertEquals(6, ((List<?>) dmCareer.get("skillGaps")).size());
		assertEquals(3, ((List<?>) dmCareer.get("blindTests")).size());
		assertNotEquals(backendCareer.get("curriculum"), dmCareer.get("curriculum"));

		Map<String, Object> existingDashboard = dashboardService.getDashboard("USR01");
		assertEquals(true, existingDashboard.get("isOnboarded"));
		assertEquals(2450, existingDashboard.get("totalXp"));
		assertEquals(14, existingDashboard.get("streakCount"));
		assertEquals(2, ((List<?>) existingDashboard.get("enrollments")).size());
	}

	@Test
	@Transactional
	void enrollCompleteModuleAndDashboardSyncFlow() {
		User user = authService.register("Test Enroll User", "enroll.test@novastra.id", "secret123");
		CareerRole role = careerRoleRepository.findByRoleName("Backend Engineer (Java)").orElseThrow();
		List<Skill> skills = skillRepository.findByCategory(role.getRoleName());
		onboardingService.saveOnboarding(user.getUserId(), role.getRoleId(), 30, 1, List.of(skills.get(0).getSkillId()));

		Map<String, Object> first = enrollmentService.enroll(user.getUserId(), "CRS14");
		assertEquals(false, first.get("alreadyEnrolled"));
		assertEquals(0, ((BigDecimal) first.get("progressPercentage")).intValue());

		Map<String, Object> duplicate = enrollmentService.enroll(user.getUserId(), "CRS14");
		assertEquals(true, duplicate.get("alreadyEnrolled"));
		assertEquals(first.get("enrollmentId"), duplicate.get("enrollmentId"));

		List<Map<String, Object>> userEnrollments = enrollmentService.getEnrollmentsByUser(user.getUserId());
		assertEquals(1, userEnrollments.size());
		assertEquals("[Beginner] Java 21 OOP & Clean Architecture", userEnrollments.get(0).get("title"));

		Map<String, Object> modResult = enrollmentService.completeModule(user.getUserId(), "CRS14", "MOD20");
		assertTrue(((BigDecimal) modResult.get("progressPercentage")).compareTo(BigDecimal.valueOf(30)) > 0);
		assertEquals(50, modResult.get("xpAwarded"));
		assertEquals(50, modResult.get("totalXp"));
		assertEquals(1, modResult.get("streakCount"));

		String enrollmentId = String.valueOf(first.get("enrollmentId"));
		Map<String, Object> clamped = enrollmentService.updateProgress(enrollmentId, BigDecimal.valueOf(150), 25);
		assertEquals(0, BigDecimal.valueOf(100).compareTo((BigDecimal) clamped.get("progressPercentage")));
		assertEquals(25, clamped.get("xpAwarded"));
		assertEquals(75, clamped.get("totalXp"));

		Map<String, Object> repeatAtHundred = enrollmentService.updateProgress(enrollmentId, BigDecimal.valueOf(100), 50);
		assertEquals(0, repeatAtHundred.get("xpAwarded"));
		assertEquals(75, repeatAtHundred.get("totalXp"));

		Map<String, Object> dash = dashboardService.getDashboard(user.getUserId());
		Map<String, Object> career = careerService.getCareerData(user.getUserId());
		assertEquals(1, dash.get("activeCoursesCount"));
		assertEquals(100, dash.get("averageProgress"));
		assertEquals(33, dash.get("careerReadinessPercentage"));
		assertEquals(1, dash.get("careerCompletedCoursesCount"));
		assertEquals(3, dash.get("careerTotalCoursesCount"));
		assertEquals(career.get("averageProgress"), dash.get("careerReadinessPercentage"));
		assertEquals(1, ((List<?>) dash.get("enrolledCourses")).size());
	}

	@Test
	@Transactional
	void legacyCourseHasModulesAndCompleteModuleAutoEnrollsAndAwardsXp() {
		List<CourseModule> crs01Modules = courseModuleRepository.findByCourseIdOrderBySequenceOrderAsc("CRS01");
		assertTrue(crs01Modules.size() >= 3, "Expected default modules seeded for pre-existing course CRS01");

		User user = authService.register("Legacy Course User", "legacy.crs01@novastra.id", "secret123");
		CareerRole role = careerRoleRepository.findByRoleName("Frontend & PWA Developer").orElseThrow();
		List<Skill> skills = skillRepository.findByCategory(role.getRoleName());
		onboardingService.saveOnboarding(user.getUserId(), role.getRoleId(), 20, 1, List.of(skills.get(0).getSkillId()));

		String firstModuleId = crs01Modules.get(0).getModuleId();
		Map<String, Object> result = enrollmentService.completeModule(user.getUserId(), "CRS01", firstModuleId);
		BigDecimal pct = (BigDecimal) result.get("progressPercentage");
		assertTrue(pct.compareTo(BigDecimal.valueOf(30)) > 0 && pct.compareTo(BigDecimal.valueOf(40)) < 0);
		assertEquals(50, result.get("xpAwarded"));
		assertEquals(50, result.get("totalXp"));

		Map<String, Object> dash = dashboardService.getDashboard(user.getUserId());
		Map<String, Object> career = careerService.getCareerData(user.getUserId());
		assertEquals(1, dash.get("activeCoursesCount"));
		assertTrue((Integer) dash.get("averageProgress") > 0);
		assertEquals(0, dash.get("careerReadinessPercentage"));
		assertEquals(0, dash.get("careerCompletedCoursesCount"));
		assertEquals(3, dash.get("careerTotalCoursesCount"));
		assertEquals(career.get("averageProgress"), dash.get("careerReadinessPercentage"));

		java.util.NoSuchElementException missingCourse = assertThrows(
				java.util.NoSuchElementException.class,
				() -> enrollmentService.completeModule(user.getUserId(), "CRS99", firstModuleId));
		assertEquals("Course tidak ditemukan.", missingCourse.getMessage());
	}

	@Test
	@Transactional
	void microTaskFetchAndIdempotentSubmitFlow() {
		User user = authService.register("MicroTask Tester", "microtask.test@novastra.id", "secret123");

		List<Map<String, Object>> tasks = microTaskService.getMicroTasksByModule("MOD56", user.getUserId());
		assertFalse(tasks.isEmpty(), "Expected seeded micro-tasks for MOD56");
		Map<String, Object> checkpoint = tasks.stream()
				.filter(t -> Integer.valueOf(300).equals(t.get("timestampSeconds")))
				.findFirst()
				.orElseThrow();
		String taskId = String.valueOf(checkpoint.get("taskId"));
		assertEquals(false, checkpoint.get("isCompleted"));
		assertNull(checkpoint.get("score"));

		assertThrows(IllegalArgumentException.class,
				() -> microTaskService.submitMicroTask(taskId, user.getUserId(), "   "));

		Map<String, Object> firstSubmit = microTaskService.submitMicroTask(
				taskId, user.getUserId(), "Ringkasan konsep inti modul");
		assertEquals(true, firstSubmit.get("isCompleted"));
		assertEquals(false, firstSubmit.get("alreadyCompleted"));
		assertEquals(0, BigDecimal.valueOf(100).compareTo((BigDecimal) firstSubmit.get("score")));
		assertEquals(5, String.valueOf(firstSubmit.get("resultId")).length());

		Map<String, Object> secondSubmit = microTaskService.submitMicroTask(
				taskId, user.getUserId(), "Jawaban revisi modul");
		assertEquals(true, secondSubmit.get("isCompleted"));
		assertEquals(true, secondSubmit.get("alreadyCompleted"));
		assertEquals(firstSubmit.get("resultId"), secondSubmit.get("resultId"));
		assertEquals(1, microTaskResultRepository.findByUserIdAndTaskIdIn(user.getUserId(), List.of(taskId)).size());

		Map<String, Object> refreshed = microTaskService.getMicroTasksByModule("MOD56", user.getUserId()).stream()
				.filter(t -> taskId.equals(t.get("taskId")))
				.findFirst()
				.orElseThrow();
		assertEquals(true, refreshed.get("isCompleted"));
		assertEquals(0, BigDecimal.valueOf(100).compareTo((BigDecimal) refreshed.get("score")));
	}

	@Test
	@Transactional
	@SuppressWarnings("unchecked")
	void legacyRolesHaveFullCareerCurriculumSkillsAndEnrollSync() {
		User user = authService.register("FullStack Tester", "fullstack.rol03@novastra.id", "secret123");
		CareerRole role = careerRoleRepository.findByRoleName("Full-Stack Web Developer").orElseThrow();
		List<Skill> roleSkills = skillRepository.findByCategoryIgnoreCase(role.getRoleName());
		assertEquals(6, roleSkills.size());

		onboardingService.saveOnboarding(
				user.getUserId(), role.getRoleId(), 30, 1, List.of(roleSkills.get(0).getSkillId()));

		Map<String, Object> before = careerService.getCareerData(user.getUserId());
		assertEquals("Full-Stack Web Developer", before.get("roleName"));
		List<Map<String, Object>> curriculumBefore = (List<Map<String, Object>>) before.get("curriculum");
		assertEquals(3, curriculumBefore.size());
		assertEquals(false, curriculumBefore.get(0).get("isEnrolled"));
		assertEquals(0, curriculumBefore.get(0).get("progressPercentage"));
		assertEquals(6, ((List<?>) before.get("skillGapAnalysis")).size());
		assertEquals(3, ((List<?>) before.get("blindTests")).size());
		assertEquals(3, ((List<?>) before.get("roadmapPhases")).size());
		assertEquals(3, ((List<?>) before.get("portfolioProjects")).size());

		String firstCourseId = String.valueOf(curriculumBefore.get(0).get("courseId"));
		enrollmentService.enroll(user.getUserId(), firstCourseId);
		List<CourseModule> mods = courseModuleRepository.findByCourseIdOrderBySequenceOrderAsc(firstCourseId);
		enrollmentService.completeModule(user.getUserId(), firstCourseId, mods.get(0).getModuleId());

		// Also complete a non-career course to 100% — must NOT skew Career Readiness Dashboard
		for (CourseModule nonCareerMod : courseModuleRepository.findByCourseIdOrderBySequenceOrderAsc("CRS01")) {
			enrollmentService.completeModule(user.getUserId(), "CRS01", nonCareerMod.getModuleId());
		}

		Map<String, Object> after = careerService.getCareerRoadmap(user.getUserId());
		List<Map<String, Object>> curriculumAfter = (List<Map<String, Object>>) after.get("curriculum");
		assertEquals(true, curriculumAfter.get(0).get("isEnrolled"));
		assertEquals(33, curriculumAfter.get(0).get("progressPercentage"));
		assertEquals(11, after.get("overallProgress"));
		assertEquals(11, after.get("averageProgress"));

		Map<String, Object> dash = dashboardService.getDashboard(user.getUserId());
		assertEquals(11, dash.get("careerReadinessPercentage"));
		assertEquals(0, dash.get("careerCompletedCoursesCount"));
		assertEquals(3, dash.get("careerTotalCoursesCount"));
	}

	@Test
	@Transactional
	@SuppressWarnings("unchecked")
	void blindTestSubmitPersistsHighestScoreAndUpdatesCareerStatus() {
		User user = authService.register("BlindTest Verifier", "blindtest.rol03@novastra.id", "secret123");
		CareerRole role = careerRoleRepository.findByRoleName("Full-Stack Web Developer").orElseThrow();
		List<Skill> roleSkills = skillRepository.findByCategoryIgnoreCase(role.getRoleName());
		onboardingService.saveOnboarding(
				user.getUserId(), role.getRoleId(), 30, 1, List.of(roleSkills.get(0).getSkillId()));

		Map<String, Object> initial = careerService.getCareerRoadmap(user.getUserId());
		assertEquals(false, initial.get("isCurriculumCompleted"));
		assertEquals(false, initial.get("isAllPowPassed"));
		assertEquals(false, initial.get("canSubmitPortfolio"));
		assertFalse(careerService.canSubmitPortfolio(user.getUserId()));
		List<Map<String, Object>> testsInitial = (List<Map<String, Object>>) initial.get("blindTests");
		Map<String, Object> firstCard = testsInitial.get(0);
		List<Map<String, Object>> tasks = (List<Map<String, Object>>) firstCard.get("tasks");
		assertEquals(2, tasks.size());
		assertEquals(false, firstCard.get("isPassed"));
		assertEquals(0, firstCard.get("bestScore"));
		assertEquals(0, firstCard.get("completedTasksCount"));
		assertEquals(2, firstCard.get("totalTasksCount"));

		String task0 = String.valueOf(tasks.get(0).get("taskId"));
		String task1 = String.valueOf(tasks.get(1).get("taskId"));

		Map<String, Object> partial = microTaskService.submitBlindTest(
				user.getUserId(),
				List.of(
						new com.jarvis.novastra.service.MicroTaskService.BlindTestAnswer(task0, "Semantic HTML dan TypeScript strict mode mencegah runtime bug."),
						new com.jarvis.novastra.service.MicroTaskService.BlindTestAnswer(task1, "ok")));
		assertEquals(50, partial.get("score"));
		assertEquals(false, partial.get("passed"));
		assertEquals(1, partial.get("completedTasksCount"));

		Map<String, Object> afterPartial = careerService.getCareerRoadmap(user.getUserId());
		Map<String, Object> partialCard = ((List<Map<String, Object>>) afterPartial.get("blindTests")).get(0);
		assertEquals(false, partialCard.get("isPassed"));
		assertEquals(50, partialCard.get("bestScore"));
		assertEquals(1, partialCard.get("completedTasksCount"));
		assertEquals(2, partialCard.get("totalTasksCount"));
		List<Map<String, Object>> partialTasks = (List<Map<String, Object>>) partialCard.get("tasks");
		assertEquals(true, partialTasks.get(0).get("isPassed"));
		assertEquals(false, partialTasks.get(1).get("isPassed"));

		Map<String, Object> fullPass = microTaskService.submitBlindTest(
				user.getUserId(),
				List.of(
						new com.jarvis.novastra.service.MicroTaskService.BlindTestAnswer(task0, "Semantic HTML dan TypeScript strict mode mencegah runtime bug."),
						new com.jarvis.novastra.service.MicroTaskService.BlindTestAnswer(task1, "State lokal berada di UI sedangkan state server disinkronkan dari API.")));
		assertEquals(100, fullPass.get("score"));
		assertEquals(true, fullPass.get("passed"));
		assertEquals(2, fullPass.get("completedTasksCount"));

		Map<String, Object> afterPass = careerService.getCareerRoadmap(user.getUserId());
		Map<String, Object> passedCard = ((List<Map<String, Object>>) afterPass.get("blindTests")).get(0);
		assertEquals(true, passedCard.get("isPassed"));
		assertEquals(100, passedCard.get("bestScore"));
		assertEquals(2, passedCard.get("completedTasksCount"));
		assertEquals(2, passedCard.get("totalTasksCount"));

		// Verify highest score preservation and no duplicate rows on lower re-submission
		microTaskService.submitMicroTask(task0, user.getUserId(), "Revisi skor lebih rendah", BigDecimal.valueOf(50));
		List<?> storedRows = microTaskResultRepository.findByUserIdAndTaskIdIn(user.getUserId(), List.of(task0));
		assertEquals(1, storedRows.size());
		Map<String, Object> recheckedCard = ((List<Map<String, Object>>) careerService.getCareerRoadmap(user.getUserId()).get("blindTests")).get(0);
		assertEquals(true, recheckedCard.get("isPassed"));
		assertEquals(100, recheckedCard.get("bestScore"));

		// Pass remaining Blind Test cards; AI Audit remains locked while curriculum is at 0%
		assertEquals(3, testsInitial.size());
		for (int i = 1; i < testsInitial.size(); i++) {
			List<Map<String, Object>> cardTasks = (List<Map<String, Object>>) testsInitial.get(i).get("tasks");
			List<MicroTaskService.BlindTestAnswer> answers = cardTasks.stream()
					.map(t -> new MicroTaskService.BlindTestAnswer(
							String.valueOf(t.get("taskId")),
							"Implementasi solusi terstruktur dengan pengujian integrasi dan validasi penuh."))
					.toList();
			microTaskService.submitBlindTest(user.getUserId(), answers);
		}
		Map<String, Object> powOnly = careerService.getCareerRoadmap(user.getUserId());
		assertEquals(false, powOnly.get("isCurriculumCompleted"));
		assertEquals(true, powOnly.get("isAllPowPassed"));
		assertEquals(false, powOnly.get("canSubmitPortfolio"));
		assertFalse(careerService.canSubmitPortfolio(user.getUserId()));

		// Complete all curriculum courses to 100%; portfolio unlocks once both prerequisites pass
		List<Map<String, Object>> curList = (List<Map<String, Object>>) powOnly.get("curriculum");
		assertEquals(3, curList.size());
		for (Map<String, Object> cur : curList) {
			String eid = String.valueOf(enrollmentService.enroll(user.getUserId(), String.valueOf(cur.get("courseId"))).get("enrollmentId"));
			enrollmentService.updateProgress(eid, BigDecimal.valueOf(100), 0);
		}
		Map<String, Object> unlocked = careerService.getCareerRoadmap(user.getUserId());
		assertEquals(true, unlocked.get("isCurriculumCompleted"));
		assertEquals(true, unlocked.get("isAllPowPassed"));
		assertEquals(true, unlocked.get("canSubmitPortfolio"));
		assertTrue(careerService.canSubmitPortfolio(user.getUserId()));
	}

	@Test
	@Transactional
	@SuppressWarnings("unchecked")
	void portfolioProjectBriefsAndSubmissionFlowWorkEndToEnd() {
		// 1. Every seeded PortfolioProject must carry structured instructions within VARCHAR(255)
		List<PortfolioProject> allProjects = portfolioProjectRepository.findAll();
		assertTrue(allProjects.size() >= 24);
		for (PortfolioProject p : allProjects) {
			String brief = p.getExpectedOutput();
			assertTrue(brief.length() <= 255, "Brief exceeds VARCHAR(255) for " + p.getProjectId());
			assertTrue(brief.contains("Tujuan Proyek:"), "Missing Tujuan Proyek for " + p.getProjectId());
			assertTrue(brief.contains("Kriteria Wajib:"), "Missing Kriteria Wajib for " + p.getProjectId());
			assertTrue(brief.contains("Format Pengumpulan:"), "Missing Format Pengumpulan for " + p.getProjectId());
			int bulletCount = brief.split("\n- ", -1).length - 1;
			assertEquals(3, bulletCount, "Expected 3 bullets for " + p.getProjectId());
		}

		// 2. Onboarded user gets 3 enriched portfolioProjects in LOCKED state while prerequisites are incomplete
		User user = authService.register("Portfolio Verifier", "portfolio.rol03@novastra.id", "secret123");
		CareerRole role = careerRoleRepository.findByRoleName("Full-Stack Web Developer").orElseThrow();
		List<Skill> roleSkills = skillRepository.findByCategoryIgnoreCase(role.getRoleName());
		onboardingService.saveOnboarding(
				user.getUserId(), role.getRoleId(), 30, 1, List.of(roleSkills.get(0).getSkillId()));

		Map<String, Object> roadmap = careerService.getCareerRoadmap(user.getUserId());
		List<Map<String, Object>> projects = (List<Map<String, Object>>) roadmap.get("portfolioProjects");
		assertEquals(3, projects.size());
		Map<String, Object> firstProject = projects.get(0);
		String projectId = String.valueOf(firstProject.get("projectId"));
		assertFalse(String.valueOf(firstProject.get("courseTitle")).isBlank());
		assertEquals("LOCKED", firstProject.get("lifecycleState"));
		assertEquals("LOCKED", firstProject.get("status"));
		assertEquals(false, firstProject.get("canSubmit"));

		// 3. Submitting before curriculum 100% and PoW pass is rejected with IllegalStateException
		assertThrows(IllegalStateException.class, () -> careerService.submitPortfolioProject(
				user.getUserId(), projectId, "https://github.com/novastra/sample-project"));

		// Unlock prerequisites: pass all 3 Blind Tests and complete all 3 curriculum courses -> UNLOCKED
		List<Map<String, Object>> blindTests = (List<Map<String, Object>>) roadmap.get("blindTests");
		for (Map<String, Object> bt : blindTests) {
			List<Map<String, Object>> btTasks = (List<Map<String, Object>>) bt.get("tasks");
			List<MicroTaskService.BlindTestAnswer> answers = btTasks.stream()
					.map(t -> new MicroTaskService.BlindTestAnswer(
							String.valueOf(t.get("taskId")),
							"Implementasi solusi teknis lengkap dengan validasi dan pengujian."))
					.toList();
			microTaskService.submitBlindTest(user.getUserId(), answers);
		}
		for (Map<String, Object> cur : (List<Map<String, Object>>) roadmap.get("curriculum")) {
			String eid = String.valueOf(enrollmentService.enroll(user.getUserId(), String.valueOf(cur.get("courseId"))).get("enrollmentId"));
			enrollmentService.updateProgress(eid, BigDecimal.valueOf(100), 0);
		}
		Map<String, Object> unlockedRoadmap = careerService.getCareerRoadmap(user.getUserId());
		Map<String, Object> unlockedFirst = ((List<Map<String, Object>>) unlockedRoadmap.get("portfolioProjects")).get(0);
		assertEquals("UNLOCKED", unlockedFirst.get("lifecycleState"));
		assertEquals("NOT_SUBMITTED", unlockedFirst.get("status"));
		assertEquals(true, unlockedFirst.get("canSubmit"));

		// 4a. Blank and non-http(s) URLs throw IllegalArgumentException
		assertThrows(IllegalArgumentException.class, () -> careerService.submitPortfolioProject(
				user.getUserId(), projectId, "   "));
		assertThrows(IllegalArgumentException.class, () -> careerService.submitPortfolioProject(
				user.getUserId(), projectId, "ftp://invalid-host.example/repo"));

		// 4b. Valid submission enters PENDING_REVIEW with status=PENDING, null score & null feedbackNotes
		Map<String, Object> firstSubmit = careerService.submitPortfolioProject(
				user.getUserId(), projectId, "https://github.com/novastra/first-release");
		assertEquals("PENDING_REVIEW", firstSubmit.get("lifecycleState"));
		assertEquals("PENDING", firstSubmit.get("status"));
		assertNull(firstSubmit.get("score"));
		assertNull(firstSubmit.get("feedbackNotes"));

		// 4c. Re-submission while PENDING updates single row without duplicating
		String updatedUrl = "https://github.com/novastra/updated-release";
		careerService.submitPortfolioProject(user.getUserId(), projectId, updatedUrl);
		List<PortfolioSubmission> savedRows = portfolioSubmissionRepository.findByUserIdAndProjectIdIn(
				user.getUserId(), List.of(projectId));
		assertEquals(1, savedRows.size());
		assertEquals(updatedUrl, savedRows.get(0).getExternalUrl());
		String submissionId = savedRows.get(0).getSubmissionId();

		Map<String, Object> pendingView = careerService.getCareerRoadmap(user.getUserId());
		Map<String, Object> pendingFirst = ((List<Map<String, Object>>) pendingView.get("portfolioProjects")).get(0);
		assertEquals("PENDING_REVIEW", pendingFirst.get("lifecycleState"));
		assertEquals("PENDING", pendingFirst.get("status"));
		assertNull(pendingFirst.get("score"));
		assertEquals(updatedUrl, pendingFirst.get("externalUrl"));

		// 4d. Trainer REJECTED moves project to REVIEWED/REJECTED, allows resubmit back to PENDING_REVIEW
		trainerReviewService.reviewSubmission(
				submissionId,
				new TrainerReviewService.TrainerReviewRequest(55, "Tambahkan unit test error handling.", "REJECTED"));
		Map<String, Object> rejectedView = ((List<Map<String, Object>>) careerService.getCareerRoadmap(user.getUserId()).get("portfolioProjects")).get(0);
		assertEquals("REVIEWED", rejectedView.get("lifecycleState"));
		assertEquals("REJECTED", rejectedView.get("reviewOutcome"));
		assertEquals(true, rejectedView.get("canSubmit"));
		assertEquals("Tambahkan unit test error handling.", rejectedView.get("feedbackNotes"));

		String revisedUrl = "https://github.com/novastra/revised-release";
		Map<String, Object> resubmit = careerService.submitPortfolioProject(user.getUserId(), projectId, revisedUrl);
		assertEquals("PENDING_REVIEW", resubmit.get("lifecycleState"));
		assertEquals("PENDING", resubmit.get("status"));
		assertNull(resubmit.get("score"));
		assertNull(resubmit.get("feedbackNotes"));

		// 4e. Trainer VERIFIED locks further overwrites
		trainerReviewService.reviewSubmission(
				submissionId,
				new TrainerReviewService.TrainerReviewRequest(88, "Revisi lengkap dan test berjalan bersih.", "VERIFIED"));
		Map<String, Object> verifiedView = ((List<Map<String, Object>>) careerService.getCareerRoadmap(user.getUserId()).get("portfolioProjects")).get(0);
		assertEquals("REVIEWED", verifiedView.get("lifecycleState"));
		assertEquals("VERIFIED", verifiedView.get("reviewOutcome"));
		assertEquals(false, verifiedView.get("canSubmit"));
		assertEquals(0, new BigDecimal("88.00").compareTo((BigDecimal) verifiedView.get("score")));
		assertThrows(IllegalStateException.class, () -> careerService.submitPortfolioProject(
				user.getUserId(), projectId, "https://github.com/novastra/overwrite-attempt"));
	}

	@Test
	@Transactional
	@SuppressWarnings("unchecked")
	void profileAggregatesDailyConsistencyCertificatesAndVerifiedPortfolio() {
		assertEquals(0, ProfileService.computeIntensityLevel(0));
		assertEquals(1, ProfileService.computeIntensityLevel(1));
		assertEquals(2, ProfileService.computeIntensityLevel(2));
		assertEquals(3, ProfileService.computeIntensityLevel(3));
		assertEquals(3, ProfileService.computeIntensityLevel(4));
		assertEquals(4, ProfileService.computeIntensityLevel(5));

		// Seeded user USR01 has real certificates & audited submissions in DB-Novastra
		Map<String, Object> seeded = profileService.getProfile("USR01");
		assertEquals("Nia Larsson", seeded.get("fullName"));
		assertEquals("nia.larsson@novastra.id", seeded.get("email"));
		assertEquals(14, seeded.get("streakCount"));
		List<Map<String, Object>> seededCerts = (List<Map<String, Object>>) seeded.get("certificates");
		assertEquals(1, seededCerts.size());
		assertEquals("CRT01", seededCerts.get(0).get("certificateId"));
		assertFalse(String.valueOf(seededCerts.get(0).get("courseTitle")).isBlank());
		List<Map<String, Object>> seededPow = (List<Map<String, Object>>) seeded.get("verifiedProofOfWork");
		assertEquals(2, seededPow.size());
		assertEquals(90, seeded.get("avgAiScore"));
		assertEquals(140, ((List<?>) seeded.get("dailyConsistency")).size());

		// Fresh onboarded user starts with only joined_at activity today and empty cert/PoW lists
		User user = authService.register("Profile Verifier", "profile.rol03@novastra.id", "secret123");
		CareerRole role = careerRoleRepository.findByRoleName("Full-Stack Web Developer").orElseThrow();
		List<Skill> roleSkills = skillRepository.findByCategoryIgnoreCase(role.getRoleName());
		onboardingService.saveOnboarding(
				user.getUserId(), role.getRoleId(), 30, 1, List.of(roleSkills.get(0).getSkillId()));

		Map<String, Object> initialProfile = profileService.getProfile(user.getUserId());
		assertTrue(((List<?>) initialProfile.get("certificates")).isEmpty());
		assertTrue(((List<?>) initialProfile.get("verifiedProofOfWork")).isEmpty());
		assertEquals(0, initialProfile.get("avgAiScore"));
		List<Map<String, Object>> initialDays = (List<Map<String, Object>>) initialProfile.get("dailyConsistency");
		assertEquals(140, initialDays.size());
		Map<String, Object> initialToday = initialDays.get(initialDays.size() - 1);
		assertEquals(LocalDate.now().toString(), initialToday.get("date"));
		assertEquals(1, initialToday.get("count"));
		assertEquals(1, initialToday.get("level"));

		// Add today's activities across enrollment (1), micro_task_result (2), and studypod_session (1) -> total 5
		Map<String, Object> roadmap = careerService.getCareerRoadmap(user.getUserId());
		List<Map<String, Object>> curriculum = (List<Map<String, Object>>) roadmap.get("curriculum");
		enrollmentService.enroll(user.getUserId(), String.valueOf(curriculum.get(0).get("courseId")));

		List<Map<String, Object>> blindTests = (List<Map<String, Object>>) roadmap.get("blindTests");
		List<Map<String, Object>> firstTasks = (List<Map<String, Object>>) blindTests.get(0).get("tasks");
		microTaskService.submitBlindTest(
				user.getUserId(),
				firstTasks.stream()
						.map(t -> new MicroTaskService.BlindTestAnswer(
								String.valueOf(t.get("taskId")),
								"Implementasi solusi arsitektur teruji dengan validasi lengkap."))
						.toList());

		StudyPodSession pod = new StudyPodSession();
		pod.setSessionId("SPS99");
		pod.setUserId(user.getUserId());
		pod.setSessionType("PEER_MATCH");
		pod.setScenarioType("Code Review Readiness Drill");
		pod.setSentimentScore(BigDecimal.valueOf(88.50));
		pod.setSessionDate(LocalDate.now());
		studyPodSessionRepository.save(pod);

		// Submitted portfolio URL (even with raw DB score = 0.00) auto-verifies as PoW without AI Audit
		PortfolioSubmission pending = new PortfolioSubmission();
		pending.setSubmissionId("SB999");
		pending.setUserId(user.getUserId());
		pending.setProjectId(String.valueOf(((List<Map<String, Object>>) roadmap.get("portfolioProjects")).get(0).get("projectId")));
		pending.setExternalUrl("https://github.com/novastra/pending-audit");
		pending.setScore(BigDecimal.ZERO);
		pending.setFeedbackNotes("Menunggu proses AI Audit...");
		pending.setStatus("SUBMITTED");
		portfolioSubmissionRepository.save(pending);

		Map<String, Object> activeProfile = profileService.getProfile(user.getUserId());
		List<Map<String, Object>> activeDays = (List<Map<String, Object>>) activeProfile.get("dailyConsistency");
		Map<String, Object> activeToday = activeDays.get(activeDays.size() - 1);
		assertEquals(5, activeToday.get("count"));
		assertEquals(4, activeToday.get("level"));
		List<Map<String, Object>> autoVerified = (List<Map<String, Object>>) activeProfile.get("verifiedProofOfWork");
		assertEquals(1, autoVerified.size());
		assertEquals("VERIFIED", autoVerified.get(0).get("status"));
		assertTrue(((Number) activeProfile.get("avgPowScore")).intValue() >= 90);
		assertEquals(activeProfile.get("avgPowScore"), activeProfile.get("avgAiScore"));
	}

	@Test
	@Transactional
	@SuppressWarnings("unchecked")
	void profileSettingsUpdateAndPermanentDeleteWorkWithoutFkErrors() {
		User user = authService.register("Settings Tester", "settings.rol03@novastra.id", "secret123");
		CareerRole role = careerRoleRepository.findByRoleName("Full-Stack Web Developer").orElseThrow();
		List<Skill> roleSkills = skillRepository.findByCategoryIgnoreCase(role.getRoleName());
		onboardingService.saveOnboarding(
				user.getUserId(), role.getRoleId(), 30, 1, List.of(roleSkills.get(0).getSkillId()));
		String uid = user.getUserId();

		// 1. Update name & email with empty newPassword -> old password must stay intact
		Map<String, Object> updated = profileService.updateProfile(
				uid, "Settings Updated", "SETTINGS.NEW@novastra.id", "");
		assertEquals("Settings Updated", updated.get("fullName"));
		assertEquals("settings.new@novastra.id", updated.get("email"));
		assertEquals(uid, authService.login("settings.new@novastra.id", "secret123").getUserId());

		// 2. Duplicate email used by another account must fail cleanly
		IllegalArgumentException dupEx = assertThrows(IllegalArgumentException.class, () ->
				profileService.updateProfile(uid, "Settings Updated", "nia.larsson@novastra.id", ""));
		assertEquals("Email sudah digunakan oleh akun lain.", dupEx.getMessage());

		// 3. Too-short newPassword must fail
		assertThrows(IllegalArgumentException.class, () ->
				profileService.updateProfile(uid, "Settings Updated", "settings.new@novastra.id", "123"));

		// 4. Valid newPassword updates password_user in PostgreSQL
		profileService.updateProfile(uid, "Settings Final", "settings.final@novastra.id", "newSecret99");
		assertEquals(uid, authService.login("settings.final@novastra.id", "newSecret99").getUserId());

		// 5. Populate all 6 FK child tables then permanently delete the account
		Map<String, Object> roadmap = careerService.getCareerRoadmap(uid);
		String courseId = String.valueOf(((List<Map<String, Object>>) roadmap.get("curriculum")).get(0).get("courseId"));
		enrollmentService.enroll(uid, courseId);

		List<Map<String, Object>> tasks = (List<Map<String, Object>>) ((List<Map<String, Object>>) roadmap.get("blindTests")).get(0).get("tasks");
		microTaskService.submitBlindTest(uid, List.of(new MicroTaskService.BlindTestAnswer(
				String.valueOf(tasks.get(0).get("taskId")),
				"Jawaban validasi teknis lengkap untuk memenuhi pengujian micro-task.")));

		PortfolioSubmission sub = new PortfolioSubmission();
		sub.setSubmissionId("SB998");
		sub.setUserId(uid);
		sub.setProjectId(String.valueOf(((List<Map<String, Object>>) roadmap.get("portfolioProjects")).get(0).get("projectId")));
		sub.setExternalUrl("https://github.com/novastra/delete-check");
		sub.setScore(BigDecimal.valueOf(91.00));
		sub.setFeedbackNotes("Audit lolos sebelum uji hapus akun.");
		sub.setStatus("Approved");
		portfolioSubmissionRepository.save(sub);

		StudyPodSession pod = new StudyPodSession();
		pod.setSessionId("SPS98");
		pod.setUserId(uid);
		pod.setSessionType("PEER_MATCH");
		pod.setScenarioType("Delete Cascade Drill");
		pod.setSentimentScore(BigDecimal.valueOf(85.00));
		pod.setSessionDate(LocalDate.now());
		studyPodSessionRepository.save(pod);

		Certificate cert = new Certificate();
		cert.setCertificateId("CRT99");
		cert.setUserId(uid);
		cert.setCourseId(courseId);
		cert.setCredentialUrl("https://novastra.id/cert/CRT99");
		cert.setIssueDate(LocalDate.now());
		certificateRepository.save(cert);

		profileService.deleteUserAccount(uid);

		assertFalse(userRepository.existsById(uid));
		LocalDate today = LocalDate.now();
		assertTrue(microTaskResultRepository.findByUserIdAndCompletedAtBetween(uid, today.minusDays(1), today.plusDays(1)).isEmpty());
		assertTrue(portfolioSubmissionRepository.findByUserId(uid).isEmpty());
		assertTrue(certificateRepository.findByUserIdOrderByIssueDateDesc(uid).isEmpty());
		assertTrue(studyPodSessionRepository.findByUserIdAndSessionDateBetween(uid, today.minusDays(1), today.plusDays(1)).isEmpty());
		assertTrue(enrollmentRepository.findByUserId(uid).isEmpty());
		assertTrue(userSkillGapRepository.findByUserId(uid).isEmpty());
	}

	@Test
	@Transactional
	@SuppressWarnings("unchecked")
	void studyPodCreatesPeerMatchSessionAndFeedsProfileHeatmap() {
		User user = authService.register("Peer Practice Verifier", "studypod.rol03@novastra.id", "secret123");
		CareerRole role = careerRoleRepository.findByRoleName("Full-Stack Web Developer").orElseThrow();
		List<Skill> roleSkills = skillRepository.findByCategoryIgnoreCase(role.getRoleName());
		onboardingService.saveOnboarding(
				user.getUserId(), role.getRoleId(), 30, 1, List.of(roleSkills.get(0).getSkillId()));
		String uid = user.getUserId();

		// 1. AI_ROLEPLAY session type must be rejected
		assertThrows(IllegalArgumentException.class, () ->
				studyPodService.createPeerSession(uid, "AI_ROLEPLAY", "System Design & Arsitektur API", null));

		// 2. Default session sets PEER_MATCH and sentimentScore = 85.00 and feeds today's heatmap count (1 -> 2)
		Map<String, Object> first = studyPodService.createPeerSession(
				uid, null, "Bedah Arsitektur & Clean Code", null);
		assertEquals("PEER_MATCH", first.get("sessionType"));
		assertEquals("Bedah Arsitektur & Clean Code", first.get("scenarioType"));
		assertEquals(0, new BigDecimal("85.00").compareTo((BigDecimal) first.get("sentimentScore")));
		assertEquals(LocalDate.now().toString(), first.get("sessionDate"));

		List<Map<String, Object>> daysAfterOne = (List<Map<String, Object>>) profileService.getProfile(uid).get("dailyConsistency");
		Map<String, Object> todayAfterOne = daysAfterOne.get(daysAfterOne.size() - 1);
		assertEquals(2, todayAfterOne.get("count"));
		assertEquals(2, todayAfterOne.get("level"));

		// 3. Second consecutive session allocates next distinct SPxxx ID despite seeded SPSxx rows
		Map<String, Object> second = studyPodService.createPeerSession(
				uid, "PEER_MATCH", "System Design & Arsitektur API", BigDecimal.valueOf(92.5));
		assertNotEquals(first.get("sessionId"), second.get("sessionId"));
		assertEquals("PEER_MATCH", second.get("sessionType"));
		assertEquals(0, new BigDecimal("92.50").compareTo((BigDecimal) second.get("sentimentScore")));

		List<Map<String, Object>> daysAfterTwo = (List<Map<String, Object>>) profileService.getProfile(uid).get("dailyConsistency");
		Map<String, Object> todayAfterTwo = daysAfterTwo.get(daysAfterTwo.size() - 1);
		assertEquals(3, todayAfterTwo.get("count"));
		assertEquals(3, todayAfterTwo.get("level"));
	}

	@Test
	@Transactional
	@SuppressWarnings("unchecked")
	void studyPodRoomSupportsTwoPeersActionsNotesAndSavesOnLeave() {
		String topic = "System Design & LAN Sync Test";
		CareerRole role = careerRoleRepository.findByRoleName("Full-Stack Web Developer").orElseThrow();
		List<Skill> roleSkills = skillRepository.findByCategoryIgnoreCase(role.getRoleName());

		User peer1 = authService.register("Peer Satu", "peer1.lan@novastra.id", "secret123");
		User peer2 = authService.register("Peer Dua", "peer2.lan@novastra.id", "secret123");
		User peer3 = authService.register("Peer Tiga", "peer3.lan@novastra.id", "secret123");
		onboardingService.saveOnboarding(peer1.getUserId(), role.getRoleId(), 30, 1, List.of(roleSkills.get(0).getSkillId()));
		onboardingService.saveOnboarding(peer2.getUserId(), role.getRoleId(), 30, 1, List.of(roleSkills.get(0).getSkillId()));

		// 1. Peer 1 joins and creates the room
		Map<String, Object> joined1 = studyPodRoomService.joinRoom(peer1.getUserId(), topic);
		assertEquals(1, joined1.get("participantCount"));
		Object roomId = joined1.get("roomId");

		// Rejoining with the same user keeps count at 1
		Map<String, Object> rejoined1 = studyPodRoomService.joinRoom(peer1.getUserId(), topic);
		assertEquals(1, rejoined1.get("participantCount"));
		assertEquals(roomId, rejoined1.get("roomId"));

		// 2. Peer 2 joins the same room
		Map<String, Object> joined2 = studyPodRoomService.joinRoom(peer2.getUserId(), topic);
		assertEquals(2, joined2.get("participantCount"));
		assertEquals(roomId, joined2.get("roomId"));

		// 3. Peer 3 cannot join a full room (max 2)
		assertThrows(IllegalStateException.class, () -> studyPodRoomService.joinRoom(peer3.getUserId(), topic));

		// 4. Mute, raise hand, and shared note actions update in-memory room state
		studyPodRoomService.performAction(peer1.getUserId(), topic, "TOGGLE_MUTE", null);
		studyPodRoomService.performAction(peer1.getUserId(), topic, "TOGGLE_HAND", null);
		studyPodRoomService.performAction(peer2.getUserId(), topic, "ADD_NOTE", "https://figma.com/file/novastra-demo");

		Map<String, Object> roomState = studyPodRoomService.getRoomState(topic);
		List<com.jarvis.novastra.model.RoomParticipant> participants =
				(List<com.jarvis.novastra.model.RoomParticipant>) roomState.get("participants");
		assertEquals(2, participants.size());
		assertTrue(participants.get(0).isMuted());
		assertTrue(participants.get(0).isHandRaised());
		assertFalse(participants.get(1).isMuted());

		List<com.jarvis.novastra.model.RoomNote> notes =
				(List<com.jarvis.novastra.model.RoomNote>) roomState.get("notes");
		assertEquals(1, notes.size());
		assertEquals("Peer Dua", notes.get(0).getSenderName());
		assertEquals("https://figma.com/file/novastra-demo", notes.get(0).getContent());

		// 5. HTTP Controller + JSON contract verification (isMuted/isHandRaised/409 Conflict)
		MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
		try {
			mockMvc.perform(get("/api/studypod/room/state").param("scenarioType", topic))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$.participantCount").value(2))
					.andExpect(jsonPath("$.participants[0].isMuted").value(true))
					.andExpect(jsonPath("$.participants[0].isHandRaised").value(true))
					.andExpect(jsonPath("$.participants[1].isMuted").value(false))
					.andExpect(jsonPath("$.notes[0].senderName").value("Peer Dua"));

			mockMvc.perform(post("/api/studypod/room/join")
							.contentType(MediaType.APPLICATION_JSON)
							.content("{\"userId\":\"" + peer3.getUserId() + "\",\"scenarioType\":\"" + topic + "\"}"))
					.andExpect(status().isConflict());
		} catch (Exception e) {
			throw new RuntimeException(e);
		}

		// 6. Peer 1 leaves -> session saved, Peer 2 remains in active room
		Map<String, Object> leave1 = studyPodRoomService.leaveRoom(peer1.getUserId(), topic);
		assertEquals("PEER_MATCH", leave1.get("sessionType"));
		assertEquals(Boolean.TRUE, leave1.get("roomActive"));
		assertEquals(1, studyPodRoomService.getRoomState(topic).get("participantCount"));

		// 6. Peer 2 leaves -> session saved and empty room removed
		Map<String, Object> leave2 = studyPodRoomService.leaveRoom(peer2.getUserId(), topic);
		assertEquals(Boolean.FALSE, leave2.get("roomActive"));
		assertNull(studyPodRoomService.getRoomState(topic).get("roomId"));
		assertEquals(0, studyPodRoomService.getRoomState(topic).get("participantCount"));

		LocalDate today = LocalDate.now();
		assertEquals(1, studyPodSessionRepository.findByUserIdAndSessionDateBetween(peer1.getUserId(), today, today).size());
		assertEquals(1, studyPodSessionRepository.findByUserIdAndSessionDateBetween(peer2.getUserId(), today, today).size());
	}

	@Test
	@Transactional
	@SuppressWarnings("unchecked")
	void studyPodTopicsMatchUserCareerRoleAndIncludeCrossRole() throws Exception {
		CareerRole fsRole = careerRoleRepository.findByRoleName("Full-Stack Web Developer")
				.orElseGet(() -> {
					CareerRole r = new CareerRole();
					r.setRoleId("TSTFS");
					r.setRoleName("Full-Stack Web Developer");
					r.setDescription("Full-Stack Test Role");
					return careerRoleRepository.save(r);
				});
		CareerRole daRole = careerRoleRepository.findByRoleName("Data Analyst")
				.orElseGet(() -> {
					CareerRole r = new CareerRole();
					r.setRoleId("TSTDA");
					r.setRoleName("Data Analyst");
					r.setDescription("Data Analyst Test Role");
					return careerRoleRepository.save(r);
				});
		CareerRole uxRole = careerRoleRepository.findByRoleName("Senior UI/UX Designer")
				.orElseGet(() -> {
					CareerRole r = new CareerRole();
					r.setRoleId("TSTUX");
					r.setRoleName("Senior UI/UX Designer");
					r.setDescription("UI/UX Test Role");
					return careerRoleRepository.save(r);
				});
		CareerRole mktRole = careerRoleRepository.findByRoleName("Digital Marketing Lead")
				.orElseGet(() -> {
					CareerRole r = new CareerRole();
					r.setRoleId("TSTMK");
					r.setRoleName("Digital Marketing Lead");
					r.setDescription("Fallback Test Role");
					return careerRoleRepository.save(r);
				});

		User fsUser = authService.register("FS Topics", "fs.topics@novastra.id", "secret123");
		fsUser.setRoleId(fsRole.getRoleId());
		fsUser = userRepository.save(fsUser);

		User daUser = authService.register("DA Topics", "da.topics@novastra.id", "secret123");
		daUser.setRoleId(daRole.getRoleId());
		daUser = userRepository.save(daUser);

		User uxUser = authService.register("UX Topics", "ux.topics@novastra.id", "secret123");
		uxUser.setRoleId(uxRole.getRoleId());
		uxUser = userRepository.save(uxUser);

		User mktUser = authService.register("MKT Topics", "mkt.topics@novastra.id", "secret123");
		mktUser.setRoleId(mktRole.getRoleId());
		mktUser = userRepository.save(mktUser);

		Map<String, Object> fsRes = studyPodService.getTopicsForUser(fsUser.getUserId());
		List<StudyPodService.PracticeTopic> fsTopics = (List<StudyPodService.PracticeTopic>) fsRes.get("topics");
		assertEquals("Full-Stack Web Developer", fsRes.get("roleName"));
		assertEquals(5, fsTopics.size());
		assertEquals("System Design & Arsitektur API", fsTopics.get(0).title());
		assertEquals("Cross-Role Technical Collaboration", fsTopics.get(4).title());

		Map<String, Object> daRes = studyPodService.getTopicsForUser(daUser.getUserId());
		List<StudyPodService.PracticeTopic> daTopics = (List<StudyPodService.PracticeTopic>) daRes.get("topics");
		assertEquals("Data Analyst", daRes.get("roleName"));
		assertEquals(5, daTopics.size());
		assertEquals("SQL Exploratory & Window Functions", daTopics.get(0).title());
		assertEquals("Cross-Role Technical Collaboration", daTopics.get(4).title());

		Map<String, Object> uxRes = studyPodService.getTopicsForUser(uxUser.getUserId());
		List<StudyPodService.PracticeTopic> uxTopics = (List<StudyPodService.PracticeTopic>) uxRes.get("topics");
		assertEquals("Senior UI/UX Designer", uxRes.get("roleName"));
		assertEquals(5, uxTopics.size());
		assertEquals("Design System & Token Consistency", uxTopics.get(0).title());
		assertEquals("Cross-Role Technical Collaboration", uxTopics.get(4).title());

		Map<String, Object> mktRes = studyPodService.getTopicsForUser(mktUser.getUserId());
		List<StudyPodService.PracticeTopic> mktTopics = (List<StudyPodService.PracticeTopic>) mktRes.get("topics");
		assertEquals("Digital Marketing Lead", mktRes.get("roleName"));
		assertEquals(5, mktTopics.size());
		assertEquals("System Design & Arsitektur API", mktTopics.get(0).title());
		assertEquals("Cross-Role Technical Collaboration", mktTopics.get(4).title());

		for (StudyPodService.PracticeTopic topic : daTopics) {
			assertFalse(topic.taskA().isBlank());
			assertFalse(topic.taskB().isBlank());
			assertFalse(topic.initialRubric().isBlank());
		}

		MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
		mockMvc.perform(get("/api/studypod/topics/{userId}", daUser.getUserId()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.roleName").value("Data Analyst"))
				.andExpect(jsonPath("$.topics.length()").value(5))
				.andExpect(jsonPath("$.topics[0].title").value("SQL Exploratory & Window Functions"))
				.andExpect(jsonPath("$.topics[0].taskA").isNotEmpty())
				.andExpect(jsonPath("$.topics[0].taskB").isNotEmpty())
				.andExpect(jsonPath("$.topics[0].initialRubric").isNotEmpty());

		mockMvc.perform(get("/api/studypod/topics/NOUSR"))
				.andExpect(status().isNotFound());
	}

	@Test
	@Transactional
	void learnWorkspaceReturnsAllCoursesModulesAssessmentsAndSkillGaps() throws Exception {
		CareerRole role = careerRoleRepository.findByRoleName("Data Analyst")
				.orElseThrow();
		List<Skill> skills = skillRepository.findByCategoryIgnoreCase(role.getRoleName());

		User user = authService.register("Learn Workspace Tester", "learn.ws@novastra.id", "secret123");
		onboardingService.saveOnboarding(
				user.getUserId(), role.getRoleId(), 30, 1,
				List.of(skills.get(0).getSkillId(), skills.get(1).getSkillId()));

		long totalCourses = courseRepository.count();
		MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
		mockMvc.perform(get("/api/courses/workspace").param("userId", user.getUserId()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.roleName").value("Data Analyst"))
				.andExpect(jsonPath("$.activeSkillGapsCount").value(2))
				.andExpect(jsonPath("$.totalModules").isNumber())
				.andExpect(jsonPath("$.totalAssessments").isNumber())
				.andExpect(jsonPath("$.courses.length()").value((int) totalCourses))
				.andExpect(jsonPath("$.courses[?(@.isRecommended == true)].courseId").isNotEmpty());

		mockMvc.perform(get("/api/courses/workspace"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.activeSkillGapsCount").value(0))
				.andExpect(jsonPath("$.courses.length()").value((int) totalCourses));
	}

	@Test
	@Transactional
	@SuppressWarnings("unchecked")
	void skillGapsRecalculateAcrossCurriculumBlindTestsPortfoliosAndRefresh() throws Exception {
		CareerRole role = careerRoleRepository.findByRoleName("Full-Stack Web Developer").orElseThrow();
		List<Skill> roleSkills = skillRepository.findByCategoryIgnoreCase(role.getRoleName());
		User user = authService.register("SkillGap Sync Tester", "skillgap.sync@novastra.id", "secret123");
		onboardingService.saveOnboarding(
				user.getUserId(), role.getRoleId(), 30, 1, List.of(roleSkills.get(0).getSkillId()));
		String uid = user.getUserId();

		// Initial state: 0% across all skills and 3 priority gaps
		Map<String, Object> initial = careerService.getCareerRoadmap(uid);
		List<Map<String, Object>> initialGaps = (List<Map<String, Object>>) initial.get("skillGapAnalysis");
		assertEquals(6, initialGaps.size());
		for (Map<String, Object> axis : initialGaps) {
			assertEquals(0, ((Number) axis.get("currentLevel")).intValue());
		}
		assertEquals(3, ((List<?>) initial.get("topPriorityGaps")).size());

		// Stage 1: Complete 100% curriculum -> completionFactor = 0.40
		for (Map<String, Object> cur : (List<Map<String, Object>>) initial.get("curriculum")) {
			String eid = String.valueOf(enrollmentService.enroll(uid, String.valueOf(cur.get("courseId"))).get("enrollmentId"));
			enrollmentService.updateProgress(eid, BigDecimal.valueOf(100), 0);
		}
		List<Map<String, Object>> afterCourse = (List<Map<String, Object>>) careerService.getCareerRoadmap(uid).get("skillGapAnalysis");
		for (Map<String, Object> axis : afterCourse) {
			int target = ((Number) axis.get("targetLevel")).intValue();
			assertEquals((int) Math.round(target * 0.40), ((Number) axis.get("currentLevel")).intValue());
		}

		// Stage 2: Pass 100% Blind Tests -> completionFactor = 0.70
		for (Map<String, Object> bt : (List<Map<String, Object>>) initial.get("blindTests")) {
			List<Map<String, Object>> btTasks = (List<Map<String, Object>>) bt.get("tasks");
			microTaskService.submitBlindTest(
					uid,
					btTasks.stream()
							.map(t -> new MicroTaskService.BlindTestAnswer(
									String.valueOf(t.get("taskId")),
									"Implementasi solusi terstruktur dengan pengujian menyeluruh dan integrasi penuh."))
							.toList());
		}
		List<Map<String, Object>> afterPow = (List<Map<String, Object>>) careerService.getCareerRoadmap(uid).get("skillGapAnalysis");
		for (Map<String, Object> axis : afterPow) {
			int target = ((Number) axis.get("targetLevel")).intValue();
			assertEquals((int) Math.round(target * 0.70), ((Number) axis.get("currentLevel")).intValue());
		}

		// Stage 3: Submitting portfolio projects alone (PENDING) does NOT increase skill gaps (remains 0.70)
		List<String> submissionIds = new java.util.ArrayList<>();
		for (Map<String, Object> proj : (List<Map<String, Object>>) initial.get("portfolioProjects")) {
			Map<String, Object> submitted = careerService.submitPortfolioProject(
					uid,
					String.valueOf(proj.get("projectId")),
					"https://github.com/novastra/sync-" + proj.get("projectId"));
			submissionIds.add(String.valueOf(submitted.get("submissionId")));
		}
		List<Map<String, Object>> afterPendingSubmit = (List<Map<String, Object>>) careerService.getCareerRoadmap(uid).get("skillGapAnalysis");
		for (Map<String, Object> axis : afterPendingSubmit) {
			int target = ((Number) axis.get("targetLevel")).intValue();
			assertEquals((int) Math.round(target * 0.70), ((Number) axis.get("currentLevel")).intValue());
		}

		// Stage 3b: REJECTED review or score < 70 does NOT increase skill gap
		trainerReviewService.reviewSubmission(
				submissionIds.get(0),
				new TrainerReviewService.TrainerReviewRequest(65, "Perbaiki validasi sebelum lulus.", "REJECTED"));
		List<Map<String, Object>> afterRejected = (List<Map<String, Object>>) careerService.getCareerRoadmap(uid).get("skillGapAnalysis");
		for (Map<String, Object> axis : afterRejected) {
			int target = ((Number) axis.get("targetLevel")).intValue();
			assertEquals((int) Math.round(target * 0.70), ((Number) axis.get("currentLevel")).intValue());
		}

		// Stage 4: Trainer VERIFIED score 80 lifts skill level proportionally (0.70 + 0.30 * 0.80 = 0.94)
		for (String sid : submissionIds) {
			trainerReviewService.reviewSubmission(
					sid,
					new TrainerReviewService.TrainerReviewRequest(80, "Memenuhi ekspektasi utama.", "VERIFIED"));
		}
		List<Map<String, Object>> afterVerified80 = (List<Map<String, Object>>) careerService.getCareerRoadmap(uid).get("skillGapAnalysis");
		for (Map<String, Object> axis : afterVerified80) {
			int target = ((Number) axis.get("targetLevel")).intValue();
			assertEquals((int) Math.round(target * 0.94), ((Number) axis.get("currentLevel")).intValue());
		}

		// Stage 5: Editing Trainer score 80 -> 100 is idempotent (reaches 100% of targetLevel without double counting)
		for (String sid : submissionIds) {
			trainerReviewService.reviewSubmission(
					sid,
					new TrainerReviewService.TrainerReviewRequest(100, "Sempurna setelah evaluasi ulang.", "VERIFIED"));
		}
		List<com.jarvis.novastra.entity.UserSkillGap> persistedGaps = userSkillGapRepository.findByUserId(uid);
		assertEquals(6, persistedGaps.size());

		// Reset one row to 0 in DB to verify GET /api/career/{uid} auto-heals pre-existing accounts on refresh
		com.jarvis.novastra.entity.UserSkillGap staleRow = persistedGaps.get(0);
		staleRow.setCurrentLevel(BigDecimal.ZERO);
		staleRow.setIsPriority(true);
		userSkillGapRepository.saveAndFlush(staleRow);

		MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
		mockMvc.perform(get("/api/career/{userId}", uid))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.skillGapAnalysis.length()").value(6))
				.andExpect(jsonPath("$.topPriorityGaps.length()").value(0))
				.andExpect(jsonPath("$.skillGapAnalysis[0].gap").value(0))
				.andExpect(jsonPath("$.skillGapAnalysis[5].gap").value(0));

		for (com.jarvis.novastra.entity.UserSkillGap healed : userSkillGapRepository.findByUserId(uid)) {
			assertTrue(healed.getCurrentLevel().compareTo(BigDecimal.ZERO) > 0);
			assertFalse(Boolean.TRUE.equals(healed.getIsPriority()));
		}
	}

	@Test
	@Transactional
	@SuppressWarnings("unchecked")
	void profileAutoVerifiesPortfolioAndIssuesCertificatesOnCourseCompletion() throws Exception {
		CareerRole role = careerRoleRepository.findByRoleName("Full-Stack Web Developer").orElseThrow();
		List<Skill> roleSkills = skillRepository.findByCategoryIgnoreCase(role.getRoleName());
		User user = authService.register("Cert Auto Issuer", "cert.auto@novastra.id", "secret123");
		onboardingService.saveOnboarding(
				user.getUserId(), role.getRoleId(), 30, 2, List.of(roleSkills.get(0).getSkillId()));
		String uid = user.getUserId();

		Map<String, Object> roadmap = careerService.getCareerRoadmap(uid);
		for (Map<String, Object> cur : (List<Map<String, Object>>) roadmap.get("curriculum")) {
			String eid = String.valueOf(enrollmentService.enroll(uid, String.valueOf(cur.get("courseId"))).get("enrollmentId"));
			enrollmentService.updateProgress(eid, BigDecimal.valueOf(100), 0);
		}
		for (Map<String, Object> bt : (List<Map<String, Object>>) roadmap.get("blindTests")) {
			List<Map<String, Object>> btTasks = (List<Map<String, Object>>) bt.get("tasks");
			microTaskService.submitBlindTest(
					uid,
					btTasks.stream()
							.map(t -> new MicroTaskService.BlindTestAnswer(
									String.valueOf(t.get("taskId")),
									"Solusi arsitektur modular lengkap dengan validasi dan test."))
							.toList());
		}
		for (Map<String, Object> proj : (List<Map<String, Object>>) roadmap.get("portfolioProjects")) {
			careerService.submitPortfolioProject(
					uid,
					String.valueOf(proj.get("projectId")),
					"https://github.com/novastra/cert-" + proj.get("projectId"));
		}

		MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
		mockMvc.perform(get("/api/profile/{userId}", uid))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.verifiedProofOfWork.length()").value(3))
				.andExpect(jsonPath("$.verifiedProofOfWork[0].status").value("VERIFIED"))
				.andExpect(jsonPath("$.avgPowScore").value(100))
				.andExpect(jsonPath("$.certificates.length()").value(3))
				.andExpect(jsonPath("$.certificates[0].issuer").value("Novastra Academy"))
				.andExpect(jsonPath("$.certificates[0].recipientName").value("Cert Auto Issuer"))
				.andExpect(jsonPath("$.certificates[0].instructor").isNotEmpty())
				.andExpect(jsonPath("$.certificates[0].field").value("Full-Stack Web Developer"))
				.andExpect(jsonPath("$.certificates[0].duration").isNotEmpty())
				.andExpect(jsonPath("$.certificates[0].issuedDate").isNotEmpty())
				.andExpect(jsonPath("$.certificates[0].submissionUrl").isNotEmpty())
				.andExpect(jsonPath("$.certificates[0].certificateId").value(org.hamcrest.Matchers.startsWith("NST-FSW-")));
	}

	@Test
	@Transactional
	void trainerPortalAuthListFilterAndReviewSubmissionFlow() throws Exception {
		User learner = authService.register("Trainer Target Learner", "tr.learner@novastra.id", "secret123");
		PortfolioProject project = portfolioProjectRepository.findAll().get(0);
		PortfolioSubmission sub = new PortfolioSubmission();
		sub.setSubmissionId("TR901");
		sub.setUserId(learner.getUserId());
		sub.setProjectId(project.getProjectId());
		sub.setExternalUrl("https://github.com/novastra/trainer-check");
		sub.setScore(BigDecimal.ZERO);
		sub.setFeedbackNotes("");
		sub.setStatus("SUBMITTED");
		portfolioSubmissionRepository.saveAndFlush(sub);

		MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

		// 1. Root & unauthenticated routing: localhost/127.0.0.1 -> /trainer/login, LAN IP -> Learner landing
		mockMvc.perform(get("/"))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/trainer/login"));
		mockMvc.perform(get("/").with(req -> {
					req.setServerName("127.0.0.1");
					return req;
				}))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/trainer/login"));
		mockMvc.perform(get("/").with(req -> {
					req.setServerName("172.22.7.202");
					return req;
				}))
				.andExpect(status().isOk())
				.andExpect(content().string(org.hamcrest.Matchers.containsString("/login")));
		mockMvc.perform(get("/login").with(req -> {
					req.setServerName("172.22.7.202");
					return req;
				}))
				.andExpect(status().isOk());
		mockMvc.perform(get("/trainer/submissions"))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/trainer/login"));
		mockMvc.perform(get("/trainer/login").with(req -> {
					req.setServerName("172.22.7.202");
					return req;
				}))
				.andExpect(status().isOk())
				.andExpect(content().string(org.hamcrest.Matchers.containsString("Novastra Admin")))
				.andExpect(content().string(org.hamcrest.Matchers.containsString("Trainer &amp; Reviewer Portal")))
				.andExpect(content().string(org.hamcrest.Matchers.containsString("Masuk ke Admin Portal")))
				.andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("Daftar Akun"))))
				.andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("Lanjutkan sebagai Guest"))));
		mockMvc.perform(get("/api/trainer/submissions"))
				.andExpect(status().isUnauthorized());

		// 2. Wrong password returns 401; valid credentials create HttpSession
		mockMvc.perform(post("/api/trainer/login")
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"email\":\"trainer@novastra.id\",\"password\":\"wrong\"}"))
				.andExpect(status().isUnauthorized());

		org.springframework.mock.web.MockHttpSession trainerSession =
				(org.springframework.mock.web.MockHttpSession) mockMvc.perform(post("/api/trainer/login")
								.contentType(MediaType.APPLICATION_JSON)
								.content("{\"email\":\"trainer@novastra.id\",\"password\":\"trainer123\"}"))
						.andExpect(status().isOk())
						.andExpect(jsonPath("$.authenticated").value(true))
						.andExpect(jsonPath("$.trainerName").value("Novastra Trainer"))
						.andReturn()
						.getRequest()
						.getSession(false);

		mockMvc.perform(get("/trainer/submissions").session(trainerSession))
				.andExpect(status().isOk());
		mockMvc.perform(get("/trainer/login").session(trainerSession))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/trainer/submissions"));

		// 3. List with status=PENDING & query filters finds TR901 and computes summary
		mockMvc.perform(get("/api/trainer/submissions")
						.session(trainerSession)
						.param("status", "PENDING")
						.param("q", "Trainer Target Learner"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.summary.pending").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
				.andExpect(jsonPath("$.submissions[0].submissionId").value("TR901"))
				.andExpect(jsonPath("$.submissions[0].normalizedStatus").value("PENDING"))
				.andExpect(jsonPath("$.submissions[0].expectedOutput").isNotEmpty());

		// 4. Validation errors (400 score out of bounds, 400 REJECTED without feedback, 404 missing ID)
		mockMvc.perform(put("/api/trainer/submissions/{id}/review", "TR901")
						.session(trainerSession)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"score\":105,\"feedbackNotes\":\"OK\",\"status\":\"VERIFIED\"}"))
				.andExpect(status().isBadRequest());

		mockMvc.perform(put("/api/trainer/submissions/{id}/review", "TR901")
						.session(trainerSession)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"score\":60,\"feedbackNotes\":\"   \",\"status\":\"REJECTED\"}"))
				.andExpect(status().isBadRequest());

		mockMvc.perform(put("/api/trainer/submissions/{id}/review", "NO999")
						.session(trainerSession)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"score\":90,\"feedbackNotes\":\"Bagus\",\"status\":\"VERIFIED\"}"))
				.andExpect(status().isNotFound());

		// 5. Valid review persists score, feedbackNotes, and VERIFIED status
		mockMvc.perform(put("/api/trainer/submissions/{id}/review", "TR901")
						.session(trainerSession)
						.contentType(MediaType.APPLICATION_JSON)
						.content("{\"score\":92,\"feedbackNotes\":\"Struktur kode rapi dan sesuai Expected Output.\",\"status\":\"VERIFIED\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.submission.score").value(92.0))
				.andExpect(jsonPath("$.submission.status").value("VERIFIED"))
				.andExpect(jsonPath("$.submission.feedbackNotes").value("Struktur kode rapi dan sesuai Expected Output."));

		PortfolioSubmission persisted = portfolioSubmissionRepository.findById("TR901").orElseThrow();
		assertEquals("VERIFIED", persisted.getStatus());
		assertEquals(0, new BigDecimal("92.00").compareTo(persisted.getScore()));

		// 6. Logout clears HttpSession and redirects /trainer/submissions back to /trainer/login
		mockMvc.perform(post("/api/trainer/logout").session(trainerSession))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.authenticated").value(false));
		mockMvc.perform(get("/trainer/submissions").session(trainerSession))
				.andExpect(status().is3xxRedirection())
				.andExpect(redirectedUrl("/trainer/login"));
	}

}
