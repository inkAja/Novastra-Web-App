package com.jarvis.novastra;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.jarvis.novastra.config.NovastraDataSeeder;
import com.jarvis.novastra.entity.CareerRole;
import com.jarvis.novastra.entity.Course;
import com.jarvis.novastra.entity.CourseModule;
import com.jarvis.novastra.entity.Skill;
import com.jarvis.novastra.entity.User;
import com.jarvis.novastra.repository.CareerRoleRepository;
import com.jarvis.novastra.repository.CareerSkillCalculationRepository;
import com.jarvis.novastra.repository.CourseModuleRepository;
import com.jarvis.novastra.repository.CourseRepository;
import com.jarvis.novastra.repository.MicroTaskRepository;
import com.jarvis.novastra.repository.MicroTaskResultRepository;
import com.jarvis.novastra.repository.PortfolioProjectRepository;
import com.jarvis.novastra.repository.SkillRepository;
import com.jarvis.novastra.repository.UserRepository;
import com.jarvis.novastra.repository.UserSkillGapRepository;
import com.jarvis.novastra.service.AuthService;
import com.jarvis.novastra.service.CareerService;
import com.jarvis.novastra.service.DashboardService;
import com.jarvis.novastra.service.EnrollmentService;
import com.jarvis.novastra.service.MicroTaskService;
import com.jarvis.novastra.service.OnboardingService;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
class NovastraApplicationTests {

	@Autowired
	private CourseRepository courseRepository;

	@Autowired
	private CourseModuleRepository courseModuleRepository;

	@Autowired
	private MicroTaskRepository microTaskRepository;

	@Autowired
	private MicroTaskResultRepository microTaskResultRepository;

	@Autowired
	private PortfolioProjectRepository portfolioProjectRepository;

	@Autowired
	private CareerRoleRepository careerRoleRepository;

	@Autowired
	private CareerSkillCalculationRepository careerSkillCalculationRepository;

	@Autowired
	private SkillRepository skillRepository;

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
		assertEquals(false, initial.get("canRunAiAudit"));
		assertFalse(careerService.canUserRunAudit(user.getUserId()));
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
		assertEquals(false, powOnly.get("canRunAiAudit"));
		assertFalse(careerService.canUserRunAudit(user.getUserId()));

		// Complete all curriculum courses to 100%; AI Audit unlocks once both prerequisites pass
		List<Map<String, Object>> curList = (List<Map<String, Object>>) powOnly.get("curriculum");
		assertEquals(3, curList.size());
		for (Map<String, Object> cur : curList) {
			String eid = String.valueOf(enrollmentService.enroll(user.getUserId(), String.valueOf(cur.get("courseId"))).get("enrollmentId"));
			enrollmentService.updateProgress(eid, BigDecimal.valueOf(100), 0);
		}
		Map<String, Object> unlocked = careerService.getCareerRoadmap(user.getUserId());
		assertEquals(true, unlocked.get("isCurriculumCompleted"));
		assertEquals(true, unlocked.get("isAllPowPassed"));
		assertEquals(true, unlocked.get("canRunAiAudit"));
		assertTrue(careerService.canUserRunAudit(user.getUserId()));
	}

}
