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
import com.jarvis.novastra.repository.CourseModuleRepository;
import com.jarvis.novastra.repository.CourseRepository;
import com.jarvis.novastra.repository.MicroTaskRepository;
import com.jarvis.novastra.repository.PortfolioProjectRepository;
import com.jarvis.novastra.repository.SkillRepository;
import com.jarvis.novastra.repository.UserRepository;
import com.jarvis.novastra.repository.UserSkillGapRepository;
import com.jarvis.novastra.service.AuthService;
import com.jarvis.novastra.service.CareerService;
import com.jarvis.novastra.service.DashboardService;
import com.jarvis.novastra.service.EnrollmentService;
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
	private PortfolioProjectRepository portfolioProjectRepository;

	@Autowired
	private CareerRoleRepository careerRoleRepository;

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
		assertEquals(1, dash.get("activeCoursesCount"));
		assertEquals(100, dash.get("averageProgress"));
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
		assertEquals(1, dash.get("activeCoursesCount"));
		assertTrue((Integer) dash.get("averageProgress") > 0);

		java.util.NoSuchElementException missingCourse = assertThrows(
				java.util.NoSuchElementException.class,
				() -> enrollmentService.completeModule(user.getUserId(), "CRS99", firstModuleId));
		assertEquals("Course tidak ditemukan.", missingCourse.getMessage());
	}

}
