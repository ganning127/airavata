package org.apache.airavata.pga.tests;

import java.util.concurrent.TimeUnit;

import org.apache.airavata.pga.tests.utils.UserLogin;
import org.apache.airavata.pga.tests.utils.ExpFileReadUtils;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import org.openqa.selenium.*;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.support.ui.Select;

/*
 **********Executing Amber Application on BR2**********
 * Created by Eroma on 9/12/14.
 * The script generates Amber application execution on BR2
 * experiment-name and experiment-description are read from the exp.properties file
 * Modified by Eroma on 10/23/14. Base URL & Sub URL to be read from the exp.properties file
 * Updated to work with Latest PGA by Eroma 08/05/2015
*/

public class AutoDockBR2 extends UserLogin {
  private WebDriver driver;
  private String subUrl;
  private String baseUrl;
  private boolean acceptNextAlert = true;
  private StringBuffer verificationErrors = new StringBuffer();
  private String expName = null;

  @Before
  public void setUp() throws Exception {
      driver = new FirefoxDriver();
      baseUrl = ExpFileReadUtils.readProperty("base.url");
      subUrl = ExpFileReadUtils.readProperty("sub.url");
      expName = ExpFileReadUtils.readProperty("experiment.name");
      driver.manage().timeouts().implicitlyWait(30, TimeUnit.SECONDS);

  }

  @Test
  public void testAutoDockBR2() throws Exception {
    driver.get(baseUrl + subUrl);
      authenticate(driver);
    driver.findElement(By.linkText("Experiment")).click();
    driver.findElement(By.xpath("(//a[contains(text(),'Create')])[2]")).click();
    driver.findElement(By.id("experiment-name")).clear();
      waitTime (200);
    driver.findElement(By.id("experiment-name")).sendKeys(expName +"AutoDock-BR2");
    driver.findElement(By.id("experiment-description")).clear();
      waitTime (200);
    driver.findElement(By.id("experiment-description")).sendKeys("Test Experiment");
    new Select(driver.findElement(By.id("project"))).selectByVisibleText(ExpFileReadUtils.readProperty("project.name"));
      waitTime (200);
    new Select(driver.findElement(By.id("application"))).selectByVisibleText("AutoDock");
      waitTime (200);
    driver.findElement(By.name("continue")).click();
    driver.findElement(By.id("Autodock-Input")).sendKeys(ExpFileReadUtils.AUTODOCK_INPUT1);
      waitTime (200);
    driver.findElement(By.id("Autodock-Data")).sendKeys(ExpFileReadUtils.AUTODOCK_INPUT2);
      waitTime (200);
    driver.findElement(By.id("HSG1-Maps-FLD")).sendKeys(ExpFileReadUtils.AUTODOCK_INPUT3);
      waitTime (200);
    new Select(driver.findElement(By.id("compute-resource"))).selectByVisibleText("bigred2.uits.iu.edu");
      waitTime (200);
    new Select(driver.findElement(By.id("select-queue"))).selectByVisibleText("normal");
      waitTime (200);
    driver.findElement(By.id("node-count")).clear();
    driver.findElement(By.id("node-count")).sendKeys("1");
    driver.findElement(By.id("cpu-count")).clear();
    driver.findElement(By.id("cpu-count")).sendKeys("16");
    driver.findElement(By.id("wall-time")).clear();
    driver.findElement(By.id("wall-time")).sendKeys("30");
    driver.findElement(By.id("memory-count")).clear();
    driver.findElement(By.id("memory-count")).sendKeys("0");
    driver.findElement(By.id("enableEmail")).click();
    driver.findElement(By.id("emailAddresses")).clear();
    driver.findElement(By.id("emailAddresses")).sendKeys(ExpFileReadUtils.readProperty("email1"));
    driver.findElement(By.xpath("(//button[@type='button'])[2]")).click();
    driver.findElement(By.xpath("(//input[@name='emailAddresses[]'])[2]")).clear();
    driver.findElement(By.xpath("(//input[@name='emailAddresses[]'])[2]")).sendKeys(ExpFileReadUtils.readProperty("email2"));
      waitTime (200);
    driver.findElement(By.name("launch")).click();
      waitTime (200);
  }


    private void waitTime(int i) {
        try {
            Thread.sleep(i);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

    }


  @After
  public void tearDown() throws Exception {
    driver.quit();
    String verificationErrorString = verificationErrors.toString();
    if (!"".equals(verificationErrorString)) {
      fail(verificationErrorString);
    }
  }


  private boolean isElementPresent(By by) {
    try {
      driver.findElement(by);
      return true;
    } catch (NoSuchElementException e) {
      return false;
    }
  }

  private boolean isAlertPresent() {
    try {
      driver.switchTo().alert();
      return true;
    } catch (NoAlertPresentException e) {
      return false;
    }
  }

  private String closeAlertAndGetItsText() {
    try {
      Alert alert = driver.switchTo().alert();
      String alertText = alert.getText();
      if (acceptNextAlert) {
        alert.accept();
      } else {
        alert.dismiss();
      }
      return alertText;
    } finally {
      acceptNextAlert = true;
    }
  }
}
